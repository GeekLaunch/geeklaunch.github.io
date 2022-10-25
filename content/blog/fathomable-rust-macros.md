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

Declarative macros can be declared and used alongside other code. They are declared using the special `macro_rules!` construct:

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
