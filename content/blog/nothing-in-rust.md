---
title: "Nothing in Rust"
date: 2023-02-22
lastmod: 2023-02-25
description: "My heart is empty and broken."
author: Jacob Lindahl
twitter: sudo_build
license:
  name: CC BY-SA 4.0
  link: https://creativecommons.org/licenses/by-sa/4.0/
---

This is a short anthology of the ways that nothing can be expressed in Rust.

The idea of "nothing" has a few different interpretations when it comes to programming:

- "I'm pretending like there's something here, but there actually isn't."
- "There is nothing here now."
- "There will never be anything here."
- "I'm going to leave you, waiting here, empty-handed, until the end of time."

While this may sound like the last thing my ex said to me, I am fine.

## "I'm pretending like there's something here, but there actually isn't."

### `PhantomData`

The Rust standard library is full of some really high-quality code, but there are few examples so pristine as [`std::marker::PhantomData`](https://doc.rust-lang.org/std/marker/struct.PhantomData.html).[^phantomdata_credit] (Its implementation is as elegant and pure as [`std::mem::drop`](https://doc.rust-lang.org/std/mem/fn.drop.html).)

[^phantomdata_credit]: Thanks to [ksion](https://old.reddit.com/r/rust/comments/118tzzu/nothing_in_rust/j9kl6nn/) for the suggestion to discuss `PhantomData`.

`PhantomData<T>` is a zero-sized type, regardless of `T`. It's like telling a small lie to the compiler: you're claiming to hold a `T` when you don't actually. Unlike _some_ lies, this actually serves a beneficial purpose.

In practice, I've seen it used in two main ways:

1. To hold a lifetime specifier, restricting the lifetime of its containing struct. This can be useful to artificially attach lifetimes to raw pointers.

   ```rust
   struct PointerWithLifetime<'a, T> {
       pointer: *const T,
       _marker: std::marker::PhantomData<&'a ()>,
   }
   ```

2. To simulate holding a value of type `T`, when the actual value is held (or managed) by another system. You might see this when interacting with unconventional storage models or FFI.

   ```rust
   mod external {
       pub fn get(location: u64) -> Vec<u8> { /* ... */ }
   }

   struct Slot<T> {
       location: u64,
       _marker: std::marker::PhantomData<T>,
   }

   impl<T: From<Vec<u8>>> Slot<T> {
       fn get(&self) -> T {
           T::from(external::get(self.location))
       }
   }
   ```

## "There is nothing here now."

### Null

> [There's no null in Rust.](https://www.youtube.com/watch?v=p9fLLl339iE)

You're being lied to, and possibly gaslit. I would know. "Oh, there's nothing going on with _Null_."

This is correct in _safe_ Rust.

However, sometimes it's necessary to rip off that band-aid, and explore what's going on beneath the surface.[^bandaid]

[^bandaid]: A lesson I should have learned a long time ago.

```rust
let n: *const i32 = std::ptr::null();
unsafe {
    println!("{}", *n); // Segmentation fault
}
```

(Reminder: raw pointers can only be dereferenced in an `unsafe` block.)

Rust is designed in such a way that you rarely, if ever, need to delve into the depths of pointer manipulation. You might encounter raw pointers (`*const` and `*mut` types) when interacting with C code, or if you're re[writing Quake III](https://www.youtube.com/watch?v=p8u_k2LIZyo) in Rust.

### `Option::None`

The standard library provides the `Option` enum, with its two variants `Some` and `None`. This is the recommended way to represent a value that [may or may not be present](https://www.youtube.com/watch?v=CyxnkPOMfyQ), instead of using a null pointer. It's like a little safety wrapper, and you should probably use it unless you know what you're doing and are prepared for the consequences, or are working alone.

However, there are significant differences between using a null pointer and using `None`. For one, `Option<T>` is an owned type, whereas a raw pointer is, well, a pointer to some space in memory.[^pointer_not_owned] This means that, aside from the use of `unsafe` and all the other things you have to be careful of when using raw pointers, `None` can vary in size, adapting to size of the thing it's surrounding. It's just a variant of an enum `Option<T>`, and if `T` is `Sized`, any `Option<T>` value will be at least as large as `T`, including `None`. `*const T` (when `T: Sized`) is always the same size as `usize`.

[^pointer_not_owned]: Clarification as requested by [dkopgerpgdolfg](https://old.reddit.com/r/rust/comments/118tzzu/nothing_in_rust/j9j57n7/). It could be argued that `Option<&T>` is a closer analogue to `*const T`, depending on the situation.

| Type                                                                                         | Size                     |
| -------------------------------------------------------------------------------------------- | ------------------------ |
| `*const T`                                                                                   | `8` (platform-dependent) |
| `Option<&T>`                                                                                 | `8` (platform-dependent) |
| [`Option<std::num::NonZeroU8>`](https://doc.rust-lang.org/std/num/struct.NonZeroU8.html)     | `1`                      |
| `Option<u8>`                                                                                 | `2`                      |
| [`Option<std::num::NonZeroU32>`](https://doc.rust-lang.org/std/num/struct.NonZeroU32.html)   | `4`                      |
| `Option<u32>`                                                                                | `8`                      |
| [`Option<std::num::NonZeroU128>`](https://doc.rust-lang.org/std/num/struct.NonZeroU128.html) | `16`                     |
| `Option<u128>`                                                                               | `24`                     |

## "There will never be anything here."

### The empty tuple

The empty tuple is written as an empty set of parentheses `()`.

I used to write Java code. It wasn't perfect, but at least it was classy. In Java, a method with a `void` return type does not return a value, no matter what you give or how much you give.

The empty tuple fulfills a similar purpose in Rust: functions that do not return an actual value implicitly return the empty tuple. However, it's more versatile than that.

Since the empty tuple is a value (albeit a content-less and [zero-sized one](https://doc.rust-lang.org/nomicon/exotic-sizes.html#zero-sized-types-zsts)) and _also_ a type, it can sometimes be useful to use it to parameterize the `Result` type to represent a fallible function that doesn't offer meaningful feedback.

```rust
impl Partner {
    fn process_request(&mut self, proposition: Proposition) -> Result<(), (u32, RejectionReason)> {
        use std::time::{SystemTime, Duration};
        use chrono::prelude::*;

        self.last_request = SystemTime::now();

        if SystemTime::now().duration_since(self.last_request).unwrap() < Duration::from_secs(60 * 60 * 24 * 7) {
            Err((429, RejectionReason::TooManyRequests))
        } else if proposition.deposit < self.minimum_required_deposit {
            Err((402, RejectionReason::PaymentRequired))
        } else if SystemTime::now().duration_since(self.created_at).unwrap() < Duration::from_secs(60 * 60 * 24 * 366 * 18) {
            Err((451, RejectionReason::UnavailableForLegalReasons))
        } else if Local::now().hours() < 19 {
            Err((425, RejectionReason::TooEarly))
        } else if Local::now().hours() > 20 {
            Err((503, RejectionReason::ServiceUnavailable))
        } else if proposition.len() >= 6 {
            Err((413, RejectionReason::ContentTooLarge))
        } else if !proposition.flushed() {
            Err((409, RejectionReason::Conflict))
        } else if !matches!(proposition.origin_address, Location::Permanent(..)) {
            Err((417, RejectionReason::ExpectationFailed))
        } else {
            Ok(())
        }
    }
}
```

## "I'm going to leave you, waiting here, empty-handed, until the end of time."

### The never type

How do you call the return type of a function that doesn't just _not return a value_, but straight-up [_never returns at all_](https://www.youtube.com/watch?v=dQw4w9WgXcQ)? Well, you can try all the traditional methods to no avail&mdash;you'll never be able to continue past that point, so it requires some delicate treatment.

This is called the [never type](https://en.wikipedia.org/wiki/Bottom_type). Here are a few ways to encounter it:

```rust
let never_loop = loop {}; // loop never exits
let never_panic = panic!(); // panic terminates execution

let value: u32 = match Some(1) {
    Some(x) => x,
    None => return, // `return` is of type never
};
```

Although [the syntax is still experimental](https://doc.rust-lang.org/std/primitive.never.html), the never type is denoted with the exclamation mark `!`. In the meantime, you can use [`Infallible`](https://doc.rust-lang.org/std/convert/enum.Infallible.html) as an alternative.

The never type can be useful when implementing a trait that has an associated type that you will never need. Again, if we use a `Result` as an example:

```rust
trait FailureLogProvider {
    type Error;
    fn get_failure_logs(&self) -> Result<Vec<FailureLog>, Self::Error>;
}

impl FailureLogProvider for Partner {
    type Error = !;
    fn get_failure_logs(&self) -> Result<Vec<FailureLog>, Self::Error> {
        Ok(self.failure_log)
    }
}
```

The function implementation in the example always succeeds, but the trait allows for implementations to fail. To indicate this, the associated `Error` type is the never type.

{{%bio%}}
