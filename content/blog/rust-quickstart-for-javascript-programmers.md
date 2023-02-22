---
title: "Rust quickstart for JavaScript programmers"
date: 2023-01-01
description: ""
draft: true
author: Jacob Lindahl
twitter: sudo_build
license:
  name: CC BY-SA 4.0
  link: https://creativecommons.org/licenses/by-sa/4.0/
---

So, you want to learn Rust, and fast. This guide is for people who already have experience programming, at least in languages like JavaScript or Python. It will make it a bit easier if you have experience with compiled, strongly-typed, or functional languages like C++, Java, or Haskell, but that's not required.

Why _another_ Rust guide? This is a rough outline that I have used in the past when holding Rust for Beginners workshops. Feel free to contact me if you want me to host a workshop for you.

## Rust in a sentence

> Rust is a general-purpose, statically-typed, functionally-inspired, low-level programming language that specializes in memory safety and speed and features an algebraic type system.

- **General-purpose** &mdash; Not limited to a particular application or platform, Rust can be used to build a diverse variety of solutions.
- **Statically-typed** &mdash; Data types are known (or computed) and enforced at compile time.
- **Functionally-inspired** &mdash; Many features are imported from, or are derivatives of features from FP-paradigm languages like Ocaml and Haskell.
- **Low-level** &mdash; With the absence of a garbage collector, or really any runtime to speak of, memory is managed by the programmer, albeit within the strict bounds enforced by the compiler's memory safety features, notwithstanding [`unsafe` blocks](https://doc.rust-lang.org/book/ch19-01-unsafe-rust.html).
- **Memory safety** &mdash; All safe code (that which does not use the `unsafe` keyword) is guaranteed by the compiler to not contain memory safety issues such as dangling pointers, null dereferencing, or accidental memory leaks.[^memory_leaks]
- **Speed** &mdash; Rust code compiles directly to machine code with zero or near-zero[^refcell] runtime overhead. It can fairly easily interoperate directly with C code.[^ffi]
- **Algebraic type system** &mdash; While most modern programming languages include some form of [product type](<https://en.wikipedia.org/wiki/Record_(computer_science)>), Rust also includes a fully-featured [sum type](https://en.wikipedia.org/wiki/Sum_type) as well, in the form of a discriminated union ([`enum`](https://doc.rust-lang.org/rust-by-example/custom_types/enum.html)).

[^memory_leaks]: There exist some ways to [intentionally leak memory in safe code](https://doc.rust-lang.org/std/boxed/struct.Box.html#method.leak), but it is quite explicit.
[^refcell]: You can [opt-in to garbage collection on a per-value basis](https://doc.rust-lang.org/std/cell/struct.RefCell.html).
[^ffi]: [Foreign Function Interface (FFI)](https://doc.rust-lang.org/nomicon/ffi.html)

## Set up

If you don't want to install anything, you can just use the [Rust playground](https://play.rust-lang.org/), and [skip this section](#the-language). Otherwise, if you want to set up your own system, just follow [the guide on the Rust website](https://www.rust-lang.org/learn/get-started), as it's not worth duplicating the information here.

### Tools

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

Let's get up-and-running as quickly as possible. If you're familiar with Node.js, Cargo may feel a bit similar.

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

Simple function definitions typically look like this:

```rust
fn function_name(param1: Type1, param2: Type2) -> ReturnType {
    // body
}
```

where the parameter list (everything inside the round brackets `(...)`) and return type (everything between the closing parenthesis `)` and the opening curly bracket `{`) is optional, depending on the needs of your function.

From here on, all of the code we'll be discussing can go directly inside the `main` function body (although some things, like `struct`s and other function definitions, can, and are usually recommended to be placed outside).

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

1.  ```rust
    let my_variable: i32 = 10;
    ```

    This syntax declares the type of the _binding_, and the expression is coerced to that type if possible.

2.  ```rust
    let my_variable = 10 as i32;
    ```

    This syntax casts the expression to the given type, which the binding then assumes.

3.  ```rust
    let my_variable = 10i32;
    ```

    This syntax is unique to numeric literals, and it declares the type of the expression, which the binding then assumes.

If the compiler is able to determine the appropriate type for your binding by itself, you do not need to specify it in the source code. Note that type declarations for function parameters and return types are always required (unless the function [does not return anything](#the-empty-tuple)).

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
// Multi-byte characters allowed!
let kanji_character: char = '字';
```

#### Strings

This can be a bit of a tricky topic in Rust, because there are a few different string types to think about. However, you usually only need to worry about two:

- `String` is a heap-allocated string that can be mutated in-place. This is called an "owned string".
- `&str` is a fixed-length (sometimes stack-allocated) string that cannot be mutated. This can be called a "string slice" or "string reference".

(Technically this is a bit of an oversimplification, but it will get you 90% of the way there. Once we've gone over [references](#references) and ownership we can come back to this topic.)

For now, you can convert between the two string types fairly easily:

```rust
let my_str: &str = "hello";
let my_string: String = my_str.to_string();
let another_str: &str = &my_string;
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

#### Mutability

This code will not compile:

```rust
let x = 0;
x = 1;
```

The `let` keyword in Rust works a bit like how the `const` keyword works in JavaScript, in that all identifiers it declares are immutable. In JavaScript, `const` identifiers simply cannot be reassigned, but its properties can still be changed. In Rust, immutability is total: no reassignments, and no mutation of contents either. You could say it's like `const` + [`Object.freeze`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) in JavaScript.

This seems like a pretty stringent limitation at first. However, there's an escape hatch: the `mut` keyword. Actually, if you've been following along and trying out the code examples, you'll already know about it&mdash;here's the error message you'd get if you tried to compile the above example:

```txt
error[E0384]: cannot assign twice to immutable variable `x`
 --> src\main.rs:4:5
  |
3 |     let x = 0;
  |         -
  |         |
  |         first assignment to `x`
  |         help: consider making this binding mutable: `mut x`
4 |     x = 1;
  |     ^^^^^ cannot assign twice to immutable variable

For more information about this error, try `rustc --explain E0384`.
```

Do you see it? The Rust compiler itself suggests a way to fix our code by using the `mut` keyword!

Having to use a whole additional keyword just to make a variable mutable may seem kind of inconvenient at first. However, immutable-by-default variable declarations make it easier for you to let the compiler make certain guarantees about your code, which can help detecting bugs early, for instance.

#### Shadowing

You may have noticed that [a previous example](#tuples) re-bound the `my_tuple` identifier a second time using the `let` keyword. If we were to do something like this in a language like JavaScript, we'd get an error:

```txt
Uncaught SyntaxError: redeclaration of let my_tuple
```

In Rust, however, this is allowed. It simply defines another (new, discrete) identifier that just happens to _shadow_ (override the name of) another identifier.

This can be useful when you wish to change the type or mutability of an identifier.

#### Scoping

Identifiers in Rust are block-scoped, meaning that an identifier declared within a set of curly braces `{}` is inaccessible outside of the braces.

```rust
fn main() {
    let x = 0;
    { // `y` only exists in this scope
        let y = 1;
        println!("{} {}", x, y);
    } // scope ends
    println!("{} {}", x, y); // `y` is out of scope
}
```

Output:

```text
error[E0425]: cannot find value `y` in this scope
 --> src/main.rs:7:26
  |
7 |     println!("{} {}", x, y); // `y` is out of scope
  |                          ^ help: a local variable with a similar name exists: `x`
```

### More data structures

If you wanted to, you could probably do most of your programming with just the primitive data structures described above (arrays, tuples, and primitives). However, Rust still has more to offer.

#### Structs

To a programmer familiar with an object-oriented or classical style of programming, structs should feel familiar. They look and often feel very similar to a class or dictionary-esque value.

First, we define the type:

```rust
struct BlogPost {
    title: String,
    text: String,
    author: String,
    timestamp: u64,
}
```

Then, to create an instance:

```rust
let mut post = BlogPost {
    title: "Rust quickstart for JavaScript programmers".to_string(),
    text: "So, you want to learn Rust, and fast...".to_string(),
    author: "Jacob Lindahl".to_string(),
    timestamp: 1600000000000,
};
```

Member access:

```rust
// read
println!("{}", post.title);

// mutate
post.author = "John Doe".to_string();
```

Now, really, structs are just a way to give nice labels to pieces of a tuple. This is evident in some of the other ways you can declare a struct type:

```rust
struct MyTupleStruct(u8);
struct RGBColor(u8, u8, u8);
struct RGBAColor(u8, u8, u8, u8);
```

If you're familiar with [the newtype pattern](https://wiki.haskell.org/Newtype), this is usually how it is implemented in Rust.

If you really want, you can also create [completely empty structs](https://stackoverflow.com/q/50162597):

```rust
struct LiterallyNothing;
```

While these may not initially seem to be useful, implementing some [traits](#traits) on them may change that.

#### Enums

[Rust's enums are one of its most powerful features](https://www.youtube.com/watch?v=Epwlk4B90vk). Although languages like Java and TypeScript offer a primitive form of enum, Rust's are fully-featured sum types, implemented as tagged unions.

If you're coming from a language like Java, the most basic enum will look pretty familiar:

```rust
enum LogLevel {
    Error,
    Warn,
    Info,
    Debug,
}
```

However, Rust is just getting started. Each variant of an enum can contain data, just like a struct or a tuple.

```rust
enum ImageFilter {
    InvertColors,
    Blur(f64),
    HueRotate(f64),
    DropShadow {
        x: f64,
        y: f64,
        blur: f64,
        color: String,
    },
}
```

The power doesn't end there: keep reading for more!

### Control flow

Rust has most of the control flow expressions you may expect, and a few you may not.

#### `if`

Compared to other curly-brace languages (like C++, Java, and JavaScript), Rust's `if` statements have two notable differences:

- Lack of the requirement for the condition expression to be enclosed in parentheses.
  {{%collapse title="Example"%}}
  **Rust**
  ```rust
  if a > b {
      // ...
  }
  ```
  **JavaScript, etc.**
  ```javascript
  if (a > b) {
    // ...
  }
  ```
  {{%/collapse%}}
- `if` structures in Rust can be expressions as well as just normal statements. That is, they can resolve to a value like a ternary expression in JavaScript.
  {{%collapse title="Example"%}}
  **Rust**
  ```rust
  let value = if a > b { a + b } else { a * b };
  ```
  **JavaScript**
  ```javascript
  let value = a > b ? a + b : a * b;
  ```
  {{%/collapse%}}

#### `while` & `loop`

Rust has two looping structures. `loop` is the simplest: it just loops forever until it hits a `break`. `while`, like its namesake in other languages, loops while a condition holds (or until it hits a `break`). Similarly in style to the `if` statement, the `while` condition does not need to be enclosed in parentheses.

```rust
let mut x = 0;
loop {
    if x >= 10 {
        break;
    }
    x += 1;
}
```

```rust
let mut x = 0;
while x < 10 {
    x += 1;
}
```

#### `match`

Instead of the `switch` statement found in many other common languages, Rust opted for the more "functional" `match` construct.

```rust
let operator = "*";

match operator {
    "+" => println!("add"),
    "-" => println!("subtract"),
    "*" => println!("multiply"),
    "/" => println!("divide"),
    _ => println!("unknown"), // `_` is the catch-all pattern
}
```

While matching against input cases using [Rust's pattern matching syntax](https://doc.rust-lang.org/book/ch18-03-pattern-syntax.html), you can also extract pieces from the input data using [destructuring](https://doc.rust-lang.org/rust-by-example/flow_control/match/destructuring.html).

```rust
enum MediaType {
    Movie,
    Series { episodes: u32 },
}

let media_type: MediaType = /* ... */;

match media_type {
    MediaType::Movie => println!("It's a movie!"), // single line terminated with comma
    MediaType::Series { episodes } => { // multi-line enclosed in curly braces
        println!("It's a TV show!");
        println!("It has {episodes} episodes!");
    }
}
```

`match` expressions, since they are _expressions_, can also resolve to a value:

```rust
let unit_count = match media_type {
    MediaType::Series { episodes } => episodes,
    _ => 1,
};
```

#### `if let`

[A special version of the `if` expression](https://doc.rust-lang.org/rust-by-example/flow_control/if_let.html) can perform destructuring as well. It's like a conditional `let`.

This is equivalent to the previous listing:

```rust
let unit_count = if let MediaType::Series { episodes } = media_type {
    episodes
} else {
    1
};
```

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
