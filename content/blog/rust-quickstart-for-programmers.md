---
title: "Rust Quickstart for Programmers"
date: 2023-01-01
description: ""
draft: true
author: Jacob Lindahl
twitter: sudo_build
license:
  name: CC BY-SA 4.0
  link: https://creativecommons.org/licenses/by-sa/4.0/
---

So, you want to learn Rust, and fast. This guide is for people who already have experience programming, at least in languages like JavaScript or Python. Even better if you have experience with compiled, strongly-typed, or functional languages like C++, Java, or Haskell.

Why _another_ Rust guide? This is a rough outline that I have used in the past when holding Rust for Beginners workshops. Feel free to contact me if you want me to host a workshop for you.

## Rust in a sentence

> Rust is a general-purpose, statically-typed, functionally-inspired, low-level programming language that specializes in memory safety and speed and features an algebraic type system.

- **General-purpose** &mdash; Not limited to a particular application or platform, Rust can be used to build a diverse variety of solutions.
- **Statically-typed** &mdash; Data types are known (or computed) and enforced at compile time.
- **Functionally-inspired** &mdash; Many features are directly imported from, or are derivatives of primary features of FP-paradigm languages.
- **Low-level** &mdash; With the absence of a garbage collector, or really any runtime to speak of, memory is managed by the programmer, albeit within the strict bounds enforced by the compiler's memory safety features, notwithstanding [`unsafe` blocks](https://doc.rust-lang.org/book/ch19-01-unsafe-rust.html).
- **Memory safety** &mdash; All safe code (that which does not use the `unsafe` keyword) is guaranteed by the compiler to not contain memory safety issues such as dangling pointers, null dereferencing, or accidental memory leaks.[^memory_leaks]
- **Speed** &mdash; Rust code compiles directly to machine code with zero or near-zero[^rc] runtime overhead. It can fairly easily interoperate directly with C code.[^ffi]
- **Algebraic type system** &mdash; While most modern programming languages include some form of [product type](<https://en.wikipedia.org/wiki/Record_(computer_science)>), Rust also includes a fully-featured [sum type](https://en.wikipedia.org/wiki/Sum_type) as well, in the form of a discriminated union ([`enum`](https://doc.rust-lang.org/rust-by-example/custom_types/enum.html)).

[^memory_leaks]: There exist some ways to [intentionally leak memory in safe code](https://doc.rust-lang.org/std/boxed/struct.Box.html#method.leak), but it is quite explicit.
[^rc]: You can [opt-in to garbage collection on a per-value basis](https://doc.rust-lang.org/std/rc/struct.Rc.html).
[^ffi]: [Foreign Function Interface (FFI)](https://doc.rust-lang.org/nomicon/ffi.html)

## Set up

### Installation

Luckily, if you don't want to install anything, you can just use the Rust playground. Otherwise, if you want to set up your own system, just follow [the guide on the Rust website](https://www.rust-lang.org/learn/get-started).

If you follow the website, you'll end up with a few different tools installed on your system:

- `rustup` manages your Rust installation(s): what versions you have installed, for which targets, etc.
- `rustc` is the Rust compiler. Although you can use it directly, it is cumbersome for large and complex projects.
- `cargo` will probably be the most-used tool of the three mentioned here during your Rust career. It is an all-in-one project manager, dependency installer, linter, formatter, documentation builder, and build tool. (Technically it delegates out most of those commands to dedicated tools like `rustc`, `rustdoc`, `rustfmt`, and `clippy`, but Cargo brings them all together nicely.)

You can check that everything is installed properly by running `cargo version`, and you should see something like this:

```text
$ cargo version
cargo 1.66.1 (ad779e08b 2023-01-10)
```

You can check the latest stable version number on [the Releases page on GitHub](https://github.com/rust-lang/rust/releases/latest), and you can upgrade the version currently installed on your computer with this command:

```text
rustup update stable
```

### Creating a project with Cargo

Let's get up-and-running as quickly as possible. If you're familiar with Node.JS, Cargo may feel a bit similar.

Create a new project in the directory `hello-rust`:

```text
cargo new --bin hello-rust
```

The `--bin` flag means that the new project will create standalone executable binary. The other option is the `--lib` flag, which will create a library package, which will not compile into an executable application. If neither flag is specified, creating a binary application is the default.

Let's quickly make sure that everything is working correctly by building and running the default generated "Hello World" project:

```text
cd hello-rust
cargo run
```

`cargo run` will implicitly run `cargo build` to build the application if the existing build files are out-of-date.

If everything worked according to plan, you should see something like the following:

```text
   Compiling hello-rust v0.1.0 (/.../hello-rust)
    Finished dev [unoptimized + debuginfo] target(s) in 0.92s
     Running `target/debug/hello-rust`
Hello, world!
```

If everything appears to be working correctly, open up `src/main.rs` in your favorite editor.

## The language

The default "Hello, world!" program in Rust looks something like this:

```rust
fn main() {
    println!("Hello, world!");
}
```

If you're already familiar with languages like C, C++, Java, etc., this sort of boilerplate should feel natural:

- The default program entrypoint is a function called `main`. It takes no arguments and has no return type.
- The body of the function is enclosed in curly braces.
- The contents of the function are:
  - A function[^not_actually] call to `println!` with a single argument, the string `"Hello, world!"`.

[^not_actually]: `println!` is actually a macro, but we'll get to that later. For now, it's just a special function. You can tell that it's a macro because the name ends with an exclamation point.

Not too bad, and hopefully pretty readable too.

### Basic bindings and numeric primitives

The first thing we'll look at is variable bindings.

```rust
let my_variable = 10;
```

(In addition to being valid Rust, this is also valid JavaScript&mdash;how about that!)

Though the syntax here is pretty simple, there's a bit more going on under the hood.

Remember how Rust is a statically-typed programming language? Well, in this case, the type is not explicit in the code, but the compiler still assigns it one. In this case, the type of this variable is `i32`, which is the default for otherwise unrestricted number types. `i32` means "32-bit signed integer".

As you may have guessed, there are a bunch of other number types. Generally, the names take the form of `<single-letter-prefix><bit-size>`.

| Prefix | Meaning              | Possible Sizes                       |
| ------ | -------------------- | ------------------------------------ |
| `i`    | Signed **i**nteger   | `8`, `16`, `32`, `64`, `128`, `size` |
| `u`    | **U**nsigned integer | `8`, `16`, `32`, `64`, `128`, `size` |
| `f`    | **F**loating-point   | `32`, `64`                           |

Examples:

- `i8` &mdash; signed byte
- `u64` &mdash; unsigned 64-bit integer
- `usize` &mdash; unsigned word-size integer (platform dependent: 32 bits on a 32-bit machine, 64 bits on a 64-bit machine, etc.)
- `f32` &mdash; float
- `f64` &mdash; double

We have three options to explicitly indicate the type of our binding:

- ```rust
  let my_variable: i32 = 10;
  ```

  This syntax declares the type of the _binding_, and the expression is coerced to that type if possible.

- ```rust
  let my_variable = 10 as i32;
  ```

  This syntax casts the expression to the given type, which the binding then assumes.

- ```rust
  let my_variable = 10i32;
  ```

  This syntax is unique to numeric literals, and it declares the type of the expression, which the binding then assumes.

If the compiler is able to determine the appropriate type for your binding by itself, you do not need to specify it in the source code.

### Other primitives

#### Booleans

In addition to numeric types, Rust also has booleans:

```rust
// This is a comment; ignored by the compiler
// This type annotation is superfluous, but it is included for clarity.
let happy_to_learn_rust: bool = true;

let ever_going_to_give_you_up = false;
```

#### Characters

Single Unicode characters, delimited by single quotes `'`:

```rust
let currency_symbol: char = '$';
let kanji_character: char = '字';
```

#### Arrays

Arrays are fixed-length, homogenous collections delimited by square brackets `[]` with elements separated by commas `,`. Note the type signature takes the form of `[<element-type>; <length>]`.

```rust
let my_i32_array: [u32; 4] = [1, 2, 3, 4];
let my_bool_array: [bool; 0] = [];
let my_char_array: [char; 3] = ['a', 'b', 'c'];

// Error: type signature has incorrect length
// let incorrect_array: [char; 100] = [];
```

#### Tuples

Tuples are fixed-length, heterogenous collections delimited by round brackets `()` with elements separated by commas `,`.

```rust
let my_tuple: (i32, char, [bool; 2]) = (1, 'a', [true, false]);
// It's probably easier to just let the compiler compute the type
let my_tuple = (1, 'a', [true, false]);
```

### More about bindings

#### Shadowing

#### Mutability

### Control flow

#### Operators

### Custom data structures

#### Structs

#### Enums

### Traits

### Nothing

#### The empty tuple

#### `Option`

#### The never type

### References

### Lifetimes

### Macros

## Resources

### Reading materials

- [The Rust Book](https://doc.rust-lang.org/stable/book/). Everyone should read.
- [The Rustonomicon](https://doc.rust-lang.org/nomicon/). Advanced and specific topics. Often more useful as a reference than a read-through.
- [Common Rust Lifetime Misconceptions](https://github.com/pretzelhammer/rust-blog/blob/master/posts/common-rust-lifetime-misconceptions.md). Excellent write-up that may help to dispel some common misunderstandings about how lifetimes work. However, it is a bit technical, so don't feel like you have to understand everything it says before you can use Rust.

### Exercises

- [Rustlings](https://github.com/rust-lang/rustlings) is a repository of all sorts of exercises to help you get comfortable using Rust.
- [Exercism](https://exercism.org/tracks/rust) provides a variety of online exercises and other resources.
