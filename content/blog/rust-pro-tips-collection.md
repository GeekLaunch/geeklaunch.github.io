---
title: "Rust Pro Tips (collection)"
date: 2023-04-08
description: "Level up your Rust skills."
author: Jacob Lindahl
twitter: sudo_build
license:
  name: CC BY-SA 4.0
  link: https://creativecommons.org/licenses/by-sa/4.0/
---

This is a collection of Rust "pro tips" that I've collected, most of which have been [posted on Twitter](https://twitter.com/search?q=%23RustProTip%20%40sudo_build&src=typed_query&f=top). I'll keep updating this post as I write more. Tips are ordered in reverse chronological order, with the most recent ones at the top.

## Write better tests with `#[should_panic]`

[Tweet](https://twitter.com/sudo_build/status/1649109301753937927)

Require tests to panic with `#[should_panic]`. This is useful for testing *un*happy paths. Optionally include a substring to match against the panic message.

```rust
#[test]
#[should_panic = "attempt to divide by zero"]
fn div_zero() {
    let val = 1i32.div(0);
}
```

[Docs](https://doc.rust-lang.org/book/ch11-01-writing-tests.html#checking-for-panics-with-should_panic)

## Use `#[non_exhaustive]` to prevent breaking changes

Use the `#[non_exhaustive]` attribute to prevent breaking changes when adding new fields to a struct or enum variant.

```rust
#[non_exhaustive]
pub enum Error {
    Io(IoError),
    ParseInt(ParseIntError),
    ParseFloat(ParseFloatError),
}
```

This doesn't make much a difference in the crate where the type is defined, but it's useful for downstream crates (those that depend on your crate), since it prevents breaking changes when new variants are added.

So, this is fine, but only within the crate that defines the type:

```rust
match e {
    Error::Io(_) => println!("IO error"),
    Error::ParseInt(_) => println!("Parse int error"),
    Error::ParseFloat(_) => println!("Parse float error"),
}
```

However, a crate that depends on your crate must include a wildcard pattern to handle new variants:

```rust
match e {
    Error::Io(_) => println!("IO error"),
    Error::ParseInt(_) => println!("Parse int error"),
    Error::ParseFloat(_) => println!("Parse float error"),
    _ => println!("Other error"),
}
```

[Docs](https://doc.rust-lang.org/reference/attributes/type_system.html#the-non_exhaustive-attribute)

## Union types

[Tweet](https://twitter.com/sudo_build/status/1644270712100900864)

One of Rust's lesser-known composite types is the union. While they might look like structs at first, each field is actually the same piece of memory, allowing you to reinterpret bytes as a different type. Of course, this requires `unsafe` code.

```rust
union Onion {
    uint: u32,
    tuple: (u16, u16),
    list: [u8; 4],
}

let mut o = Onion { uint: 0xAD0000 };

unsafe {
    o.tuple.0 = 0xBEEF;
    o.list[3] = 0xDE;
}

assert_eq!(unsafe { o.uint }, 0xDEADBEEF);
```

(Extra pro tip: you can do pattern matching on unions too!)

[Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=ab1034fdf89e71064bea9c1211d45926) \
[Docs](https://doc.rust-lang.org/reference/items/unions.html)

## Struct update operator `..`

[Tweet](https://twitter.com/sudo_build/status/1640782008652791810)

Use the struct update operator `..` to easily copy a struct with a few minor modifications. This can be useful when a struct implements `Default`.

```rust
#[derive(Default)]
struct Post {
    title: String,
    body: String,
    image_url: Option<String>,
    view_count: u32,
    tags: Vec<String>,
}

let p = Post {
    title: "How to make $1M posting coding tips on Twitter".into(),
    body: "1. Post coding tips on Twitter.\n2. ???\n3. Profit!".into(),
    ..Default::default()
};

assert_eq!(p.image_url, None);
assert_eq!(p.view_count, 0);
assert_eq!(p.tags, Vec::<String>::new());
```

[Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=fc1f617a87fbc2d46f5a590d8a848872)

## The `@` operator

[Tweet](https://twitter.com/sudo_build/status/1639322229635973120)

Use the `@` operator to bind an identifier to a value that matches a pattern.

```rust
struct User {
    age: u8,
    name: String,
}

let u = User { age: 25, name: "John".into() };

if let User { age: a @ ..=35, .. } = u {
    println!("Become POTUS in {} years", 35 - a);
}
```

[Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=35da937520560354673fe17b382a5069) \
[Documentation](https://doc.rust-lang.org/reference/patterns.html#identifier-patterns) \
[Rust by Example](https://doc.rust-lang.org/rust-by-example/flow_control/match/binding.html)

## Create your own iterators

[Tweet](https://twitter.com/sudo_build/status/1587820368923746304)

Rust's `Iterator` trait is super useful! Here's how to implement it:

We'll start with a data structure we want to iterate over:

```rust
struct Pair<T> {
    a: T,
    b: T,
}
```

And a function that returns the iterator:

```rust
impl<T> Pair<T> {
    pub fn iter(&self) -> PairIter<T> {
        // ...
    }
}
```

Here's our iterator struct. It keeps track of:

1. What collection we're iterating over.
2. The current location within the collection.

```rust
struct PairIter<'a, T> {
    pair: &'a Pair<T>,
    next: u8,
}
```

Let's implement `Iterator`. Note that the type of the items emitted by the iterator is defined by an associated type.

```rust
impl<'a, T> Iterator for PairIter<'a, T> {
    type Item = &'a T;

    fn next(&mut self) -> Option<Self::Item> {
        // ...
    }
}
```

The `next()` function simply needs to update the iterator and return the current item.

```rust
match self.next {
    0 => {
        self.next += 1;
        Some(&self.pair.a)
    }
    1 => {
        self.next += 1;
        Some(&self.pair.b)
    }
    _ => None,
}
```

And that's it! Now you can easily implement `Iterator` on your own types.

[Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=e8fe920cdf97a3d2dc2dd0599fdc1e3e) \
[Docs](https://doc.rust-lang.org/std/iter/trait.Iterator.html)

## Use longer names for lifetimes and generic parameters

[Tweet](https://twitter.com/sudo_build/status/1585699823067418625)

Lifetimes and generic parameters don't have to be just one character long. When you're deep in the weeds, working your Rust magic, keep your code comprehensible.

```rust
struct View<'source, Element: Deserialize> {
    label: &'source Element,
    value: &'source [u8],
}
```

## `PhantomData` 👻

[Tweet](https://twitter.com/sudo_build/status/1590277738224848896)

[`PhantomData`](https://doc.rust-lang.org/std/marker/struct.PhantomData.html) has a dead-simple definition, but fascinating use-cases. `PhantomData` makes it _look_ like your type contains another type even if it really doesn't. It's zero-sized, so it costs you nothing to use!

`PhantomData` can be useful when interfacing with external resources:

```rust
struct ExternalResource<T> {
    _marker: PhantomData<T>,
}

impl<T> ExternalResource<T> {
    fn fetch(&self) -> T { /* ... */ }
    fn update(&self, v: T) { /* ... */ }
}
```

If you're working with FFI or otherwise need to manually restrict lifetimes:

```rust
struct FP<'a>(usize, *const u8, PhantomData<&'a ()>);

impl<'a> From<&'a Vec<u8>> for FP<'a> {
    fn from(v: &'a Vec<u8>) -> Self {
        FP(v.len(), v.as_ptr(), PhantomData)
    }
}
```

[Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=3028c55bf3422a1b083f5c16c064727a) \
More in [Nomicon](https://doc.rust-lang.org/nomicon/phantom-data.html).

## `String`s are collections

[Tweet](https://twitter.com/sudo_build/status/1610855444901396480)

A `String` is a collection that can be built from an iterator:

```rust
let my_string = vec![1, 2, 3, 4]
    .iter()
    .map(|i| (i * 2).to_string())
    .collect::<String>();

assert_eq!(my_string, "2468");
```

## Enforce Clippy lints in a workspace

[Tweet](https://twitter.com/sudo_build/status/1567168431094468608)

Enforce a consistent set of Clippy lints across multiple crates in one workspace by adding to `.cargo/config.toml` at the project root.

```toml
[target.'cfg(all())']
rustflags = [
  "-Wclippy::large_digit_groups",
]
```

(Otherwise you'd need to have a `#![warn(...)]` directive in every crate.)

## The never type `!`

[Tweet](https://twitter.com/sudo_build/status/1565738760465453056)

The never type in Rust (denoted by `!`) represents a type that will never exist. Called the ["bottom type"](https://en.wikipedia.org/wiki/Bottom_type) in type theory, it's used as the type of expressions that never resolve (e.g. panics or infinite loops) or the type of a return or break statement.

The never type can be coerced to any type. For example:

```rust
let x: u32 = panic!();
```

[`!` type documentation](https://doc.rust-lang.org/std/primitive.never.html) \
[Standard library documentation](https://doc.rust-lang.org/std/primitive.never.html) \
[`Infallible` documentation](https://doc.rust-lang.org/std/convert/enum.Infallible.html) \
[Nothing in Rust]({{% ref "nothing-in-rust" %}})

## Recursive declarative macros

[Tweet](https://twitter.com/sudo_build/status/1569282411070115840)

Build quick-and-dirty parsers with recursive declarative macros.

```rust
macro_rules! m {
    (y) => { true };
    (n) => { false };
    ($a:tt xor $($b:tt)+) => { m!($a) != m!($($b)+) };
}

assert!(m!(y xor n xor n));
```

## Rustdoc link shorthand

[Tweet](https://twitter.com/sudo_build/status/1571975420073095169)

Link to a module, struct, or enum directly in rustdoc comments with the shorthand syntax:

```rust
/// Link to [`MyStruct`]
```

Works for external crates too!

```rust
/// Link to [`serde::Serialize`]
```

(Links to <https://docs.rs/serde/latest/serde/ser/trait.Serialize.html>.) Backticks are optional, they just format it nicely.

## More precise access control

[Tweet](https://twitter.com/sudo_build/status/1566036137679785984)

Specify item visibility with the `pub(restricted)` syntax:

| Syntax           | Visible in&hellip; |
| ---------------- | ------------------ |
| `pub(crate)`     | current crate      |
| `pub(super)`     | parent module      |
| `pub(self)`      | current module     |
| `pub(in <path>)` | ancestor module    |

[Docs](https://doc.rust-lang.org/reference/visibility-and-privacy.html#pubin-path-pubcrate-pubsuper-and-pubself)

## Reuse code in `build.rs` with `#[path]`

[Tweet](https://twitter.com/sudo_build/status/1620745579914752000)

Easily reuse code from your project in the `build.rs` file by using the `#[path]` directive:

```rust
#[path = "./src/parse.rs"]
mod parse;

fn main() {
    parse::om_nom(/* ... */);
}
```

Feature flags work in `build.rs` too!

```rust
#[cfg(feature = "parser")]
let feature_gated = /* ... */;
```

[`build.rs` documentation](https://doc.rust-lang.org/cargo/reference/build-scripts.html) \
[The `#[path]` attribute](https://doc.rust-lang.org/reference/items/modules.html#the-path-attribute)

## Reduce unnecessary allocations with cows 🐮

[Tweet](https://twitter.com/sudo_build/status/1571209960759132163)

The clone-on-write smart pointer [`std::borrow::Cow`](https://doc.rust-lang.org/std/borrow/enum.Cow.html) creates owned values only when necessary. It's useful when you want to work with both owned and borrowed values, and it can help you dynamically prevent unnecessary allocations.

```rust
fn f(v: &mut Cow<str>, m: bool) {
    if m {
        v.to_mut().push_str(", world");
    }
}

let mut v: Cow<str> = "hi".into();
f(&mut v, false);
assert!(v.is_borrowed()); // note: is_borrowed() is only available on nightly
f(&mut v, true);
assert!(v.is_owned());
```

[Playground](https://play.rust-lang.org/?version=nightly&mode=debug&edition=2021&gist=566eaaa7e277841ff3d9bb5c0e819be9)

## Additional trait bounds per-function

[Tweet](https://twitter.com/sudo_build/status/1572671282688438272)

Did you know you can add additional trait bounds to a type parameter for a single function when writing traits or `impl` blocks?

```rust
trait MyTrait<T: Debug> {
    fn action(&self) {
        // Implemented when T is Debug
    }

    fn print(&self) where T: Display {
        // Only implemented when T is Debug + Display
    }
}
```

[Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=e45d1a98e6c217ceb5e0b2bbb7bb7e65)

## Use the `AsRef` trait to convert references

[Tweet](https://twitter.com/sudo_build/status/1572676898559528961)

`Vec<T>`? 😢 \
`AsRef<[T]>`? 😄

```rust
fn sum_is_even(v: impl AsRef<[u32]>) -> bool {
    v.as_ref().iter().fold(true, |e, i| e == (i & 1 == 0))
}

// both work!
sum_is_even(vec![0, 2, 4]));
sum_is_even([1]);
```

[Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=c28f23e491f08b4aa537c89a0c9d12db) \
[Docs](https://doc.rust-lang.org/std/convert/trait.AsRef.html)

## Use `syn` and `quote` when writing procedural macros

[Tweet](https://twitter.com/sudo_build/status/1585700625030950912)

The crates [`syn`](https://crates.io/crates/syn) and [`quote`](https://crates.io/crates/quote) make parsing and generating streams of Rust tokens a breeze&mdash;super handy when writing procedural macros!

[More about writing procedural macros in Rust]({{% ref "fathomable-rust-macros" %}}).

## Use the `dbg!(...)` macro for better debugging

[Tweet](https://twitter.com/sudo_build/status/1564945355023663104)

Still using `println!()` debugging in Rust?

Use `dbg!()` instead. It prints the filename, line number, expression, and value and returns the value it was given. It's in the standard library, and it's shorter than `println!()`.

```rust
println!("{value:?}");
my_function(&value);
```

vs.

```rust
my_function(dbg!(&value));
```

{{% bio %}}
