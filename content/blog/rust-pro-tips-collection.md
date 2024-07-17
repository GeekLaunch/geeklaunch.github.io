---
title: "Rust Pro Tips (collection)"
date: 2023-04-08
lastmod: 2024-05-17
description: "Level up your Rust skills."
author: Jacob Lindahl
twitter: sudo_build
license:
  name: CC BY-SA 4.0
  link: https://creativecommons.org/licenses/by-sa/4.0/
---

This is a collection of Rust "pro tips" that I've collected, most of which have been [posted on Twitter](https://twitter.com/search?q=%23RustProTip%20%40sudo_build&src=typed_query&f=top). I'll keep updating this post as I write more. Tips are ordered in reverse chronological order, with the most recent ones at the top.

## 36. Specify the type of `self` in method signatures

[Tweet](https://x.com/sudo_build/status/1813491727174709278) [Toot](https://infosec.exchange/@hatchet/112800895144267784)

While the three most common types of the `self` parameter have useful shorthands (`self`, `&self`, `&mut self`), the explicit syntax can also include standard library types that deref to `Self`, including `Box<T>`, `Rc<T>`, `Arc<T>`.

```rust
use std::sync::Arc;

struct MyStruct;

impl MyStruct {
    fn only_when_wrapped(self: &Arc<Self>) {
        println!("I'm in an Arc!");
    }
}

let s = MyStruct;
// let s = Arc::new(s); // Try uncommenting this line.
s.only_when_wrapped(); // ERROR!
```

Without wrapping the value in an `Arc`, the Rust compiler produces this error:

```text
error[E0599]: no method named `only_when_wrapped` found for struct `MyStruct` in the current scope
  --> src/main.rs:14:3
   |
4  | struct MyStruct;
   | --------------- method `only_when_wrapped` not found for this struct
...
7  |     fn only_when_wrapped(self: &Arc<Self>) {
   |        ----------------- the method is available for `Arc<MyStruct>` here
...
14 | s.only_when_wrapped();
   |   ^^^^^^^^^^^^^^^^^ method not found in `MyStruct`
   |
help: consider wrapping the receiver expression with the appropriate type
   |
14 | Arc::new(s).only_when_wrapped();
   | +++++++++ +
```

[Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=3c62ee66a4590666ca3aa85070829687) \
[Docs](https://doc.rust-lang.org/reference/items/associated-items.html#methods)

---

The [`arbitrary_self_types` feature](https://github.com/rust-lang/rfcs/blob/master/text/3519-arbitrary-self-types-v2.md) allows types to implement a new trait `std::ops::Receiver` and appear in the type declaration of `self`. ([tracking issue #44874](https://github.com/rust-lang/rust/issues/44874))

## 35. Force compilation failure

[Tweet](https://x.com/sudo_build/status/1791446158055018637) [Toot](https://infosec.exchange/@hatchet/112456435462770019)

The `compile_error!(...)` macro forces compilation failure. This can be useful to indicate unsupported feature flag combinations or invalid macro arguments.

```rust
compile_error!("Boo!");

fn main() {
    println!("Hello, world!");
}
```

Compiler output:

```txt
   Compiling playground v0.0.1 (/playground)
error: Boo!
 --> src/main.rs:1:1
  |
1 | compile_error!("Boo!");
  | ^^^^^^^^^^^^^^^^^^^^^^

error: could not compile `playground` (bin "playground") due to 1 previous error
```

[Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=0f32c3705ed84087f197e860087214cc) \
[Docs](https://doc.rust-lang.org/std/macro.compile_error.html)

---

**Bonus tip #1**: Emit compiler _warnings_ using [`build.rs`](https://doc.rust-lang.org/cargo/reference/build-scripts.html):

```rust
fn main() {
    #[cfg(feature = "funky-time")]
    println!("cargo::warning=Funky mode is enabled!");
}
```

**Bonus tip #2**: Emit structured diagnostics from proc macros using [the nightly `Diagnostic` API](https://doc.rust-lang.org/proc_macro/struct.Diagnostic.html). ([tracking issue #54140](https://github.com/rust-lang/rust/issues/54140))

## 34. Enable optional dependency features with a feature

[Tweet](https://twitter.com/sudo_build/status/1756269920126726455) [Toot](https://infosec.exchange/@hatchet/111906804455534802)

Use the `?` syntax in `Cargo.toml` to activate features on optional dependencies only when those dependencies are enabled.

```toml
[dependencies]
backend-a = { version = "1", optional = true }
backend-b = { version = "1", optional = true }

[features]
default = ["backend-a"]
unstable = ["backend-a?/unstable", "backend-b?/unstable"]
# Enabling the "unstable" feature won't implicitly enable either backend.
```

[Docs](https://doc.rust-lang.org/cargo/reference/features.html#dependency-features)

## 33. Use tuple struct initializers as function pointers

[Tweet](https://twitter.com/sudo_build/status/1751597656114446377) [Toot](https://infosec.exchange/@hatchet/111833792212244273)

Tuple struct initializers can be cast to function pointers. This can help to avoid creating unnecessary lambda functions, e.g. when calling [`Iterator::map`](https://doc.rust-lang.org/std/iter/trait.Iterator.html#method.map).

```rust
#[derive(Debug, PartialEq, Eq)]
struct Point(i32, i32);

fn zeroes<T>(f: fn(i32, i32) -> T) -> T {
    f(0, 0)
}

assert_eq!(zeroes(Point), Point(0, 0));
```

[Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=7cb12bc6930a9ae03204a33eb50529ce) \
[Docs](https://doc.rust-lang.org/reference/expressions/struct-expr.html#tuple-struct-expression)

## 32. Absolute import paths

[Tweet](https://twitter.com/sudo_build/status/1733063054840262842) [Toot](https://infosec.exchange/@hatchet/111544198990772125)

Use a leading double colon (`::path`) to indicate a path relative to the root of the compilation unit. This can help to avoid name collisions when writing macros.

```rust
#[cfg(ignore)] // Remove to cause a name collision.
pub mod std {
    pub mod cmp {
        pub enum Ordering {
            Equal,
        }

        impl Ordering {
            pub fn is_eq(self) -> bool {
                panic!("Bamboozled!");
            }
        }
    }
}

macro_rules! create_function {
    () => {
        // Try replacing the next line with the one below it.
        fn print_is_equal(o: std::cmp::Ordering) {
        // fn print_is_equal(o: ::std::cmp::Ordering) {
            println!("is equal? {}", o.is_eq());
        }
    }
}

create_function!();
print_is_equal(std::cmp::Ordering::Equal);
```

[Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=28efee7fea89819e78f16b91b24e87e4) \
[Docs](https://doc.rust-lang.org/book/appendix-02-operators.html#non-operator-symbols)

## 31. Use indirection in enums to save memory

[Tweet](https://twitter.com/sudo_build/status/1727616005038641462) [Toot](https://infosec.exchange/@hatchet/111459094208915697)

All variants of an enum are the same size. This can become a problem when variants have drastically different memory requirements. Use indirection (`&`-reference, `Box`, etc.) to resolve.

```rust
enum WithoutIndirection {
    Unit,
    Kilobyte([u8; 1024]),
}

enum WithIndirection<'a> {
    Unit,
    Kilobyte(&'a [u8; 1024]),
}

println!("{}", std::mem::size_of_val(&WithoutIndirection::Unit));
// => 1025

println!("{}", std::mem::size_of_val(&WithIndirection::Unit));
// => 8
```

[Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=bee0edb5a4b888c8c9d3df0e473246cc) \
[Docs](https://doc.rust-lang.org/reference/types/enum.html)

## 30. Create a slice from a reference without copying

[Tweet](https://twitter.com/sudo_build/status/1702009293850165747) [Toot](https://infosec.exchange/@hatchet/111058977026865657)

If you have a reference to some data and you want to pass it to a function that takes a slice, you can use [`std::array::from_ref`](https://doc.rust-lang.org/std/array/fn.from_ref.html) to cheaply create a slice without copying.

```rust
struct Thing;

fn takes_slice(_: &[Thing]) {
    // ...
}

fn my_function(arg: &Thing) {
    takes_slice(std::array::from_ref(arg));
}

fn main() {
    my_function(&Thing);
}
```

[Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=76925f46c4aaceb7c39c3d58030ae0a4)

## 29. Include README in documentation

[Tweet](https://twitter.com/sudo_build/status/1696353871088803917) [Toot](https://infosec.exchange/@hatchet/110970596795877242)

Insert the README into a crate's documentation by putting `#![doc = include_str!("../README.md")]` in `lib.rs`. This can help avoid duplicating information between the README and the documentation, and will also test README examples as doctests.

```rust
// lib.rs
#![doc = include_str!("../README.md")]
```

[Docs](https://doc.rust-lang.org/rustdoc/write-documentation/the-doc-attribute.html) \
[Documentation from a crate that does this](https://docs.rs/size-trait/)

## 28. Workspace dependencies

[Tweet](https://twitter.com/sudo_build/status/1690286028555423744) [Toot](https://infosec.exchange/@hatchet/110875801320226379)

Easily specify a uniform dependency version for all crates in a workspace with the `[workspace.dependencies]` table in `Cargo.toml`.

```toml
# Cargo.toml

[workspace]
members = ["my_crate"]

[workspace.dependencies]
serde = "1.0.183"
```

```toml
# my_crate/Cargo.toml

[dependencies]
serde.workspace = true # -> 1.0.183
```

[Docs](https://doc.rust-lang.org/cargo/reference/workspaces.html#the-dependencies-table)

## 27. Testing for compilation failure

[Tweet](https://twitter.com/sudo_build/status/1683855149956218881)

Create tests intended to fail compilation with the `compile_fail` attribute on documentation tests.

````rust
/// ```compile_fail
/// my_function("hello");
/// ```
pub fn my_function(value: u8) {}
````

The compilation error is `error[E0308]: mismatched types`, which you can check for specifically:

````rust
/// ```compile_fail,E0308
/// my_function("hello");
/// ```
pub fn my_function(value: u8) {}
````

[Docs](https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html#attributes)

## 26. Sealed traits

[Tweet](https://twitter.com/sudo_build/status/1682766520534069249)

If a public trait requires the implementation of a private trait, the public trait is "sealed" and can only be implemented within the crate that defines it.

```rust
// my_crate/src/lib.rs

mod private {
    pub trait Sealed {}

    impl Sealed for u8 {}
}

pub trait PublicTrait: private::Sealed {}

impl PublicTrait for u8 {}
```

```rust
// another_crate/src/lib.rs

use my_crate::PublicTrait;

// error: requires private::Sealed implementation
impl PublicTrait for String {}

// error: my_crate::private::Sealed is private
impl my_crate::private::Sealed for String {}
```

[Rust API Guidelines](https://rust-lang.github.io/api-guidelines/future-proofing.html#sealed-traits-protect-against-downstream-implementations-c-sealed)

## 25. Static type size assertion

[Tweet](https://twitter.com/sudo_build/status/1681191747584655361)

Use `std::mem::transmute::<S, D>` to assert that two types have the same size at _compile_ time.

```rust
use std::mem::transmute;

struct TwoBytes(u8, u8);

let _ = transmute::<TwoBytes, u16>; // ok
let _ = transmute::<TwoBytes, u32>; // error!
```

The compiler will complain if the types are not the same size:

```txt
error[E0512]: cannot transmute between types of different sizes, or dependently-sized types
```

Warning: Memory layout, alignment, etc. is often [not guaranteed](https://doc.rust-lang.org/reference/type-layout.html), so be careful!

[Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=651556514aeefaf1c3468ba13b573661) \
[Docs](https://doc.rust-lang.org/std/mem/fn.transmute.html)

## 24. Conditional compilation

[Tweet](https://twitter.com/sudo_build/status/1673726139339251712)

Use the `cfg` and `cfg_attr` attributes to compile different code based on the build environment. This is useful for feature-gating, platform-specific code, etc.

```rust
// Implements Serialize if the crate is built with the "serde" feature enabled
#[cfg_attr(feature = "serde", derive(serde::Serialize))]
struct Point2(f64, f64);

fn main() {
    #[cfg(target_os = "linux")]
    let person = "Linus Torvalds";
    #[cfg(target_os = "windows")]
    let person = "Bill Gates";
    #[cfg(target_os = "macos")]
    let person = "Tim Apple";

    // Approval-seeking!
    println!("Hi there, {person}!");
}
```

[Docs](https://doc.rust-lang.org/reference/conditional-compilation.html) \
[Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=05bef59f5aac574cb610c42d49c54b81)

## 23. Declaratively create `HashMap`s from iterables

[Tweet](https://twitter.com/sudo_build/status/1664101178479898624)

`HashMap`s can be built from iterators of key-value tuples:

```rust
use std::collections::HashMap;

let map: HashMap<&str, i32> = [
    ("a", 1),
    ("b", 2),
    ("c", 3),
    ("d", 4),
]
.into();
```

[Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=cfa3d57767aed32f6720e2c5d4f0cd88) \
[Docs](https://doc.rust-lang.org/std/collections/struct.HashMap.html#method.from)

## 22. `impl` vs. `dyn` in assembler

[Tweet](https://twitter.com/sudo_build/status/1654822176686755841)

Use `impl` for generic monomorphization, `dyn` for dynamic dispatch.

```rust
fn with_impl<'a>(v: &'a impl AsRef<[u8]>) -> &'a str {
    std::str::from_utf8(v.as_ref()).unwrap()
}

fn with_dyn<'a>(v: &'a dyn AsRef<[u8]>) -> &'a str {
    std::str::from_utf8(v.as_ref()).unwrap()
}

pub fn main() {
    let array = [72, 101, 108, 108, 111];
    let vector = vec![72, 101, 108, 108, 111];
    assert_eq!("Hello", with_impl(&array));
    assert_eq!("Hello", with_dyn(&array));
    assert_eq!("Hello", with_impl(&vector));
    assert_eq!("Hello", with_dyn(&vector));
}
```

See the effect in the [generated assembly](https://godbolt.org/z/dGW4vdsfK). `with_impl` is generated once for each parameterization. `with_dyn` is generated once, but a vtable is required at runtime.

```x86asm
; with_impl(&[u8; 5]) implementation (monomorphized)
_ZN7example9with_impl17h38cd8c9aec305c25E:
        sub     rsp, 40
        ; constant lookup
        mov     rax, qword ptr [rip + _ZN4core5array92_$LT$impl$u20$core..convert..AsRef$LT$$u5b$T$u5d$$GT$$u20$for$u20$$u5b$T$u3b$$u20$N$u5d$$GT$6as_ref17h86d8b288e84fcf8aE@GOTPCREL]
        call    rax
        mov     rsi, rax
        ; [[snip]]

; with_impl(&Vec<u8>) implementation (monomorphized)
_ZN7example9with_impl17hd50582b2776df596E:
        sub     rsp, 40
        ; constant lookup
        mov     rax, qword ptr [rip + _ZN88_$LT$alloc..vec..Vec$LT$T$C$A$GT$$u20$as$u20$core..convert..AsRef$LT$$u5b$T$u5d$$GT$$GT$6as_ref17h56f6b2151f0bc49cE@GOTPCREL]
        call    rax
        mov     rsi, rax
        ; [[snip]]

; with_dyn(&dyn AsRef<[u8]>) fat pointer implementation
_ZN7example8with_dyn17h88123f4b1a0b56e4E:
        sub     rsp, 40
        ; get vtable entry
        mov     rax, qword ptr [rsi + 24]
        call    rax
        mov     rsi, rax
        ; [[snip]]
```

When invoking `with_dyn`, the computer must construct the vtable at runtime.

```x86asm
        ; [[snip]]
        ; with_dyn(&Vec<u8>) invocation
        ; load the vtable
        lea     rsi, [rip + .L__unnamed_14]
        lea     rdi, [rsp + 176]
        call    _ZN7example8with_dyn17h88123f4b1a0b56e4E
        ; [[snip]]

.L__unnamed_14:
        .quad   _ZN4core3ptr46drop_in_place$LT$alloc..vec..Vec$LT$u8$GT$$GT$17hec70dc68d599b27eE
        .asciz  "\030\000\000\000\000\000\000\000\b\000\000\000\000\000\000"
        .quad   _ZN88_$LT$alloc..vec..Vec$LT$T$C$A$GT$$u20$as$u20$core..convert..AsRef$LT$$u5b$T$u5d$$GT$$GT$6as_ref17h56f6b2151f0bc49cE
```

Compare this to the invocation of a monomorphized function:

```x86asm
        ; [[snip]]
        ; with_impl(&Vec<u8>) invocation
        lea     rdi, [rsp + 176]
        call    _ZN7example9with_impl17hd50582b2776df596E
        ; [[snip]]
```

No vtable required!

[`dyn` docs](https://doc.rust-lang.org/std/keyword.dyn.html) \
[`impl` docs](https://doc.rust-lang.org/std/keyword.impl.html)

## 21. Closure traits

[Tweet](https://twitter.com/sudo_build/status/1651431413491863552)

Rule of thumb: the _more_ a closure does with captured variables, the _fewer_ traits it implements.

Only reads? `Fn + FnMut + FnOnce`. \
Mutates? `FnMut + FnOnce`. \
Moves? `FnOnce`.

No captures at all? Function pointer coercion, too!

```rust
fn impl_fn_once(_: &impl FnOnce() -> ()) {}
fn impl_fn_mut(_: &impl FnMut() -> ()) {}
fn impl_fn(_: &impl Fn() -> ()) {}
fn fn_pointer(_: fn() -> ()) {}

#[derive(Debug)]
struct Var(i32);

{ // A
    let mut var = Var(0);
    let f = || drop(var);
    impl_fn_once(&f);
    impl_fn_mut(&f);
    impl_fn(&f);
    fn_pointer(f);
}

{ // B
    let f = || println!("{:?}", Var(0));
    impl_fn_once(&f);
    impl_fn_mut(&f);
    impl_fn(&f);
    fn_pointer(f);
}

{ // C
    let mut var = Var(0);
    let f = || println!("{:?}", var);
    impl_fn_once(&f);
    impl_fn_mut(&f);
    impl_fn(&f);
    fn_pointer(f);
}

{ // D
    let mut var = Var(0);
    let f = || var.0 += 1;
    impl_fn_once(&f);
    impl_fn_mut(&f);
    impl_fn(&f);
    fn_pointer(f);
}
```

[Rust Book](https://doc.rust-lang.org/book/ch13-01-closures.html) \
[Rust Reference](https://doc.rust-lang.org/reference/types/closure.html#call-traits-and-coercions) \
[Playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=8fb56d1dff43dba3dfe958df21222e08)

## 20. Write better tests with `#[should_panic]`

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

## 19. Use `#[non_exhaustive]` to prevent breaking changes

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

## 18. Union types

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

## 17. Struct update operator `..`

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

## 16. The `@` operator

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

## 15. Create your own iterators

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

## 14. Use longer names for lifetimes and generic parameters

[Tweet](https://twitter.com/sudo_build/status/1585699823067418625)

Lifetimes and generic parameters don't have to be just one character long. When you're deep in the weeds, working your Rust magic, keep your code comprehensible.

```rust
struct View<'source, Element: Deserialize> {
    label: &'source Element,
    value: &'source [u8],
}
```

## 13. `PhantomData` 👻

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

## 12. `String`s are collections

[Tweet](https://twitter.com/sudo_build/status/1610855444901396480)

A `String` is a collection that can be built from an iterator:

```rust
let my_string = vec![1, 2, 3, 4]
    .iter()
    .map(|i| (i * 2).to_string())
    .collect::<String>();

assert_eq!(my_string, "2468");
```

## 11. Enforce Clippy lints in a workspace

**Update**: As of Rust 1.74, [Clippy lints can now be configured in `Cargo.toml`](https://blog.rust-lang.org/2023/11/16/Rust-1.74.0.html#lint-configuration-through-cargo). While the method originally described in this tip is still available, `Cargo.toml` is likely a more convenient way to configure lints.

```toml
[lints.clippy]
large_digit_groups = "warn"
```

---

[Tweet](https://twitter.com/sudo_build/status/1567168431094468608)

Enforce a consistent set of Clippy lints across multiple crates in one workspace by adding to `.cargo/config.toml` at the project root.

```toml
[target.'cfg(all())']
rustflags = [
  "-Wclippy::large_digit_groups",
]
```

(Otherwise you'd need to have a `#![warn(...)]` directive in every crate.)

## 10. The never type `!`

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

## 9. Recursive declarative macros

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

## 8. Rustdoc link shorthand

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

## 7. More precise access control

[Tweet](https://twitter.com/sudo_build/status/1566036137679785984)

Specify item visibility with the `pub(restricted)` syntax:

| Syntax           | Visible in&hellip; |
| ---------------- | ------------------ |
| `pub(crate)`     | current crate      |
| `pub(super)`     | parent module      |
| `pub(self)`      | current module     |
| `pub(in <path>)` | ancestor module    |

[Docs](https://doc.rust-lang.org/reference/visibility-and-privacy.html#pubin-path-pubcrate-pubsuper-and-pubself)

## 6. Reuse code in `build.rs` with `#[path]`

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

## 5. Reduce unnecessary allocations with cows 🐮

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

## 4. Additional trait bounds per-function

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

## 3. Use the `AsRef` trait to convert references

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

## 2. Use `syn` and `quote` when writing procedural macros

[Tweet](https://twitter.com/sudo_build/status/1585700625030950912)

The crates [`syn`](https://crates.io/crates/syn) and [`quote`](https://crates.io/crates/quote) make parsing and generating streams of Rust tokens a breeze&mdash;super handy when writing procedural macros!

[More about writing procedural macros in Rust]({{% ref "fathomable-rust-macros" %}}).

## 1. Use the `dbg!(...)` macro for better debugging

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
