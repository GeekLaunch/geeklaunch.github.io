---
title: 'Fathomable Rust Macros'
date: 2022-10-25
draft: true
description: 'A breakdown of the inner workings and authorship of macros in Rust'
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

It is at this point that the Rust compiler evaluates macros. Remember, a macro takes a stream of tokens as input, and also outputs a stream of tokens. This has some major implications:

- Rust macros can add new code: add a trait implementation, create a new struct, write a new function, etc.
- Rust macros cannot interact with the logic in the code (e.g. see whether type A implements trait B, call function X), because the logic has not actually been constructed yet.

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
my_macro!(quux => 9 * 8);
```

### Nested macros & recursion

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

Cool. We have the basic infrastructure set up, now we just have _parse the input token stream(s)_.

The Rust compiler hasn't even been so kind as to create the syntax tree for us yet. We just get a token stream, and we have to somehow parse it into something sensible (like a struct definition, `impl` block, etc.), manipulate it in some way, and then synthesize an output that the compiler can make sense of as valid code.

That's a _lot_ of work for one macro!

Enter: `syn` and `quote`.

## Communicating with the compiler

`syn` and `quote` are a pair of crates that simplify token stream manipulation. `syn` provides utilities for parsing token streams into syntax trees, and `quote` for converting Rust-like code back into token streams.

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

The `quote` macro produces a `TokenStream2` (which can be easily transformed into a normal `TokenStream` via `.into()`) from some Rust code-like input. It also supports variable interpolation, via the `#identifier` syntax seen above.

In the world of macro authorship, `syn` and `quote` are pretty ubiquitous. [Here's an example of `syn` and `quote` used in the popular crate `thiserror`](https://github.com/dtolnay/thiserror/blob/464e2e798eea0985af3c2c16cc55866e2918f774/impl/src/expand.rs).

## Further Reading

- [The "Macros" chapter in The Rust Book](https://doc.rust-lang.org/book/ch19-06-macros.html)
- [The Little Book of Rust Macros](https://veykril.github.io/tlborm/)
- [dtolnay's procedural macros workshop](https://github.com/dtolnay/proc-macro-workshop)

{{% bio %}}
