---
title: "Fathomable Rust Macros"
date: 2022-10-25
lastmod: 2022-10-26
description: "A breakdown of the inner workings and authorship of macros in Rust"
author: Jacob Lindahl
twitter: sudo_build
license:
  name: CC BY-SA 4.0
  link: https://creativecommons.org/licenses/by-sa/4.0/
---

Rust macros are compile-time constructs that operate on streams of Rust language tokens.

## A brief aside on compilation

What are "Rust language tokens"?

When a compiler begins compiling a program, it first reads in the source code file. For simplicity's sake, let's say the compiler stores that source code in a string. The next step is to step through the string, character by character, and divide it up into "tokens."

For example, a Rust snippet like:

```rust
let foo: u32 = 30;
```

Might be "tokenized" into:

```rust
[
    KeywordLet,
    Identifier("foo"),
    Colon,
    Identifier("u32"),
    SingleEquals,
    NumericLiteral("30"),
    Semicolon,
]
```

(Note that this is a completely imaginary example.)

A macro takes a stream of tokens akin to the above as input, and also outputs a stream of tokens.[^madklad-1] This has some major implications:

[^madklad-1]: Correction from [matklad](https://matklad.github.io/):

    > The macro evaluation process is ... messy, a correct thing to say is that "in rust compiler, parsing, name resolution, and macro expansion are mutually recursive procedures which happen at the same time". Luckily, I think for the purposes of this post we don't need to explain when macro expansion happens, it is enough to say "tokens is what is used as input or output of the macro. Macros don't have direct access to a parsed AST, but a macro can parse input tokens itself".

- Rust macros can add new code: add a trait implementation, create a new struct, write a new function, etc.
- Rust macros cannot interact with the logic in the code (e.g. see whether a type implements a trait, call a function declared in the source, etc.), because the logic has not actually been constructed yet.

---

There are two main categories of Rust macros: declarative macros and procedural macros.

## Declarative macros

Declarative macros can be declared and used alongside other code. They are declared using the special `macro_rules!` construct, and have some unique syntax:

```rust
macro_rules! my_macro {
    ($a: ident => $b: expr) => {
        fn $a() {
            println!("{}", $b);
        }
    };
    ($a: ident, $b: expr) => {
        println!("{} {}", $a, $b);
    };
}
```

Declarative macros accept Rust tokens as input and perform pattern matching against them. In the example above, the macro `my_macro` matches two different patterns:

1. An identifier and an expression separated by a fat arrow `=>`, and
2. An identifier and an expression separated by a comma `,`.

This macro could be invoked like:

```rust
my_macro!(foo, 45);
my_macro!(bar => "hello");
my_macro!(baz => 9 * 8);
```

### Nested macros and recursion

One of the most popular Rust crates, [`serde_json`](https://crates.io/crates/serde_json), includes a declarative macro [`json!()`](https://docs.rs/serde_json/latest/serde_json/macro.json.html), which allows you to write JSON-like syntax in your Rust code. It returns a [`serde_json::Value`](https://docs.rs/serde_json/latest/serde_json/enum.Value.html).

```rust
json!({
    "id": 42,
    "name": {
        "first": "John",
        "last": "Zoidberg",
    },
});
```

As it turns out, you can put any valid Rust expression (that evaluates to a value that implements `Serialize`) as the value:

```rust
json!({
    "id": 21 + 21, // Computed expression
    "name": {
        "first": "John",
        "last": "Zoidberg",
    },
});
```

And I mean _any_ valid Rust expression&hellip;

```rust
json!({
    "id": 21 + 21,
    "name": json!({ // This is another macro invocation!
        "first": "John",
        "last": "Zoidberg",
    }),
});
```

This ability extends to the code that your macro generates as well. For example, we can write a basic parser that recursively translates the logic symbols for AND (&and;; `^` in code) and OR (&or;; `v` in code) into the Rust equivalents.

```rust
macro_rules! andor {
    ($a: ident ^ $b: ident $($tail: tt)*) => {
        $a && andor!($b $($tail)*) // Recursive invocation
    };
    ($a: ident v $b: ident $($tail: tt)*) => {
        $a || andor!($b $($tail)*) // Recursive invocation
    };
    ($($a: tt)*) => {
        $($a)*
    }
}

andor!(true ^ false v false ^ true) // true && false || false && true
// => false
```

Because it is a potentially infinite operation, the macro recursion has a [maximum depth defined by the Rust compiler](https://doc.rust-lang.org/reference/attributes/limits.html#the-recursion_limit-attribute).

## Procedural macros

Procedural macros are written using normal Rust code (not a unique syntax), which is compiled, and then run by the compiler when invoked. For this reason, procedural macros are also sometimes called "compiler plugins."

Because crates = compilation units, in order for a procedural macro to be compiled before its execution, procedural macros must be defined in (and subsequently exported from) a different crate from that in which they are used. These must be library crates with the following in `Cargo.toml`:

```toml
[lib]
proc-macro = true
```

Procedural macros appear in three forms, which are all invoked differently:

- Attribute-like. \
   Input: annotated item. \
   Ouput _replaces_ input. (Original input does not exist in final token stream.)

  ```rust
  #[my_attribute_macro]
  struct MyStruct; // This struct is the input to the macro

  struct AnotherStruct; // This struct is not part of the macro's input
  ```

- Custom derive. \
   Input: annotated item. \
   Output _is appended to_ input. (Original input still exists in final token stream.)

  ```rust
  #[derive(MyDeriveMacro)]
  struct MyStruct; // This struct is the input to the macro

  struct AnotherStruct; // This struct is not part of the macro's input
  ```

- Function-like. \
   Input: enclosed token stream. Delimiters are `[]`, `{}`, or `()`. \
   Output _replaces_ input. (Original input does not exist in final token stream.)
  ```rust
  my_function_like_macro!(arbitrary + token : stream 00);
  // is the same as
  my_function_like_macro![arbitrary + token : stream 00];
  // is the same as
  my_function_like_macro!{arbitrary + token : stream 00};
  ```

In this post, I will discuss writing attribute and derive macros.

## Authoring procedural macros

At first glance, writing a procedural macro from scratch can be _really daunting_:

```rust
use proc_macro::TokenStream;

#[proc_macro_attribute]
pub fn my_attribute_macro(attr: TokenStream, item: TokenStream) -> TokenStream {
    todo!("Good luck!")
}
```

This macro could be invoked like this:

```rust
#[my_attribute_macro]
struct AnnotatedItem;
```

In this case, the `attr` token stream would be empty, and the `item` token stream would contain the `AnnotatedItem` struct.

If you invoke the macro like this:

```rust
#[my_attribute_macro(attribute_tokens)]
fn my_function() {}
```

In this case, the `attr` token stream would contain `attribute_tokens`, and the `item` token stream would contain the `my_function` function.

Cool. We have the basic infrastructure set up, now we just have parse the input token streams.

The Rust compiler hasn't even been so kind as to create the syntax tree for us yet. We just get a token stream, and we have to somehow parse it into something sensible (like a struct definition, `impl` block, etc.), manipulate it in some way, and then synthesize an output that the compiler can make sense of as valid code.

That's a _lot_ of work to do!

Enter: `syn` and `quote`.

## Communicating with the compiler

[`syn`](https://crates.io/crates/syn) and [`quote`](https://crates.io/crates/quote) are a pair of crates that simplify token stream manipulation. `syn` provides utilities for parsing token streams into syntax trees, and `quote` for converting Rust-like code back into token streams.

The basic use-cases for each of these crates are extremely simple&mdash;they're very well-designed crates!

Here is a bare-bones attribute macro using `syn` and `quote`, which does absolutely nothing (it returns its input):

```rust
use proc_macro::TokenStream;
use syn::{parse_macro_input, AttributeArgs, Item};
use quote::quote;

#[proc_macro_attribute]
pub fn my_attribute_macro(attr: TokenStream, item: TokenStream) -> TokenStream {
    let _attr = parse_macro_input!(attr as AttributeArgs);
    let item = parse_macro_input!(item as Item);

    quote!{
        #item
    }.into()
}
```

The `parse_macro_input` macro tries to parse a `TokenStream` into a `syn` data structure, and produces a compiler error on failure. The [`syn` data structures and documentation](https://docs.rs/syn) are worth perusing on your own. They will give you a pretty good idea of what a syntax tree might look like.

The `Item` parsed in the example above is an enum, which you can `match` against:

```rust
match item { // The annotated item was parsed as...
    Item::Enum(e) => {}, // ...an enum
    Item::Fn(f) => {}, // ...a function
    Item::Impl(i) => {}, // ...an impl block
    Item::Struct(s) => {}, // ...a struct

    // ...and so on and so forth
    _ => todo!(),
}
```

The `quote` macro produces a `proc_macro2::TokenStream` (which can be easily transformed into a normal `proc_macro::TokenStream` via `Into::into`) from some input that is like Rust code. It also supports variable interpolation, via the `#identifier` syntax seen above.

In the world of macro authorship, `syn` and `quote` are pretty ubiquitous. [Here's an example of `syn` and `quote` used in the popular crate `thiserror`](https://github.com/dtolnay/thiserror/blob/464e2e798eea0985af3c2c16cc55866e2918f774/impl/src/expand.rs).

## Parameterization and configuration

The last tool in our belt for building maintainable and usable macros is [`darling`](https://crates.io/crates/darling). The crate's stated description is:

> A proc-macro library for reading attributes into structs when implementing custom derives.

However, it is useful for both custom derives and attribute macros. `syn` and `quote` are useful for parsing and manipulating streams of normal Rust tokens, and `darling` is useful for parsing attribute and item input streams into custom structs, attaching custom logic to process, and reporting errors, making the combination of these three crates a powerful framework for procedural macro authorship.

## Practical Example

Here is an example of a very simple derive macro using all three crates, complete with [error-handling](https://docs.rs/darling/0.14.1/darling/error/struct.Accumulator.html), an optional configuration parameter, and some of `darling`'s [auto-forwarded fields](https://docs.rs/darling/0.14.1/darling/#fromderiveinput) (`data`, `generics`, `ident`, `fields`).

```rust
use darling::{FromDeriveInput, FromVariant};
use proc_macro2::TokenStream as TokenStream2;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, Path};

#[derive(Debug, FromDeriveInput)]
// The struct will be deserialized from a `#[display]` attribute on any kind of enum
#[darling(attributes(display), supports(enum_any))]
struct EnumMeta {
    // Try to optionally deserialize an item path
    pub transform: Option<Path>,

    // Forwarded attributes
    pub ident: syn::Ident,
    pub generics: syn::Generics,
    pub data: darling::ast::Data<VariantVisitor, ()>,
}

#[derive(Debug, FromVariant)]
struct VariantVisitor {
    // The name of the enum variant
    pub ident: syn::Ident,
    pub fields: darling::ast::Fields<()>,
}

fn expand(meta: EnumMeta) -> Result<TokenStream2, darling::Error> {
    let EnumMeta {
        transform,
        data,
        generics,
        ident,
    } = meta;

    let variants = data.take_enum().unwrap();

    let match_arms = variants.iter().map(|variant| {
        let i = &variant.ident;
        let name = i.to_string();
        match variant.fields.style {
            darling::ast::Style::Tuple => {
                quote! { Self :: #i ( .. ) => #name , }
            }
            darling::ast::Style::Struct => {
                quote! { Self :: #i { .. } => #name , }
            }
            darling::ast::Style::Unit => {
                quote! { Self :: #i  => #name , }
            }
        }
    });

    // Properly includes generics in output
    let (imp, ty, wher) = generics.split_for_impl();

    // Rust code output
    Ok(quote! {
        impl #imp std::fmt::Display for #ident #ty #wher {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                write!(f, "{}", #transform (
                    match self { #(#match_arms)* }
                ))
            }
        }
    })
}

// Declares the name of the macro and the attributes it supports
#[proc_macro_derive(Display, attributes(display))]
pub fn derive_display(input: proc_macro::TokenStream) -> proc_macro::TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    FromDeriveInput::from_derive_input(&input)
        .and_then(expand)
        .map(Into::into)
        // Error handling
        .unwrap_or_else(|e| e.write_errors().into())
}
```

[This code is also available on GitHub](https://github.com/GeekLaunch/hello-rust-macros).

This derive macro creates an implementation of `Display` on the targeted enum. It optionally accepts a `transform` attribute field, which is a path to a function which transforms the name of the variant before it is written out.

## Further Reading

- [The "Macros" chapter in The Rust Book](https://doc.rust-lang.org/book/ch19-06-macros.html)
- [The Little Book of Rust Macros](https://veykril.github.io/tlborm/)
- [dtolnay's procedural macros workshop](https://github.com/dtolnay/proc-macro-workshop)
- [Rust AST Explorer](https://carlkcarlk.github.io/rust-ast-explorer/) (credit: [matklad](https://matklad.github.io/))
