---
title: "Dumping databases for faster furigana"
date: 2023-02-25
description: "The SQLite-supplanting sequel."
author: Jacob Lindahl
twitter: sudo_build
license:
  name: CC BY-SA 4.0
  link: https://creativecommons.org/licenses/by-sa/4.0/
---

_(Note: This is a follow-up to [this post about the `autoruby` project]({{< ref "blog/grammatical-automatic-furigana-with-sqlite-and-rust" >}}). If you're not familiar with the project that is the subject of this post, I would encourage you to read it.)_

The original `autoruby` worked just fine, but it struggled with performance. It wasn't able to process faster than 1kbps! That's not great, especially for the [_"blazing fast"_](https://www.youtube.com/watch?v=1M9hPXg-bFM) Rust programming language.

It was pretty obvious throughout the debugging process that the primary bottleneck in the whole operation was the interaction with SQLite. Now, SQLite is a great piece of tech, but it really wasn't a good fit for this project. A language dictionary really doesn't experience much change, and if it does, the changes are almost certainly not time-critical, at least, not for the intended users of this tool.

SQLite, and, by extension, relational databases at large, are generally geared towards non-static datasets. Ours, on the other hand, is just about as static as they come.[^user_changes]

[^user_changes]: There is the possibility of supporting user-provided entries in the future. Since these are not likely to be large in number, or rapidly changing, I think it is acceptable for them to simply be added on top of the static dataset. That is, the tool can pull entries from two sources: the static dictionary and the user-provided one.

So, if the dictionary is static, and we don't need to use a "real" database to store it, we have more freedom to make our lookups that much faster.

Here's the idea:

1. At compile time:
   1. Construct the entire dictionary (complete with relations, etc.) in memory.
   2. Serialize it to a compact, but fast-to-deserialize binary blob.
   3. Write that blob directly into the executable.
2. At runtime:
   1. Deserialize the blob.

That's it!

## In-memory construction

This actually results in a major simplification of the current set of data structures, since relational database IDs, etc. don't need to be recorded.

As such, I shall label this step as _not interesting&trade;_ and move on.

## Serialization

We have the dictionary fully loaded in memory, and now we need to serialize it into a binary blob which we can write directly to the executable.

[The `bincode` crate](https://crates.io/crates/bincode) provides exactly what we are looking for. Its format and API are both quite simple, leveraging [the `serde` serialization suite](https://serde.rs/).

(In order for the blob to actually work when it is deserialized, the contents of the dictionary should generally not contain references or pointers, as they will likely not be recoverable when they are deserialized again.)

## Executable += blob

This is the fun part!

There are a few different ways to run code at compile-time: `const` functions, [procedural macros]({{< ref "blog/fathomable-rust-macros#procedural-macros" >}}), and [the `build.rs` file](https://doc.rust-lang.org/cargo/reference/build-scripts.html). The way that we are currently generating the dictionary is not a `const`-friendly set of operations (it involves a lot of filesystem I/O and even an optional Internet download), so we're left with macros and `build.rs`.

Presently, I've elected to perform the dictionary generation and serialization in a `build.rs` file, but that may change in the future. This particular decision also requires that we write out the serialized blob into a temporary file,[^out_dir] and then read it back into the source code later.

[^out_dir]: Although not strictly enforced, it is highly discouraged for `build.rs` scripts to output files to anywhere _other than_ the directory indicated by [the `OUT_DIR` environment variable](https://doc.rust-lang.org/cargo/reference/environment-variables.html#environment-variables-cargo-sets-for-build-scripts), which is provided at compile time.

Arbitrary binary blobs can be included in a Rust source file as a `&'static [u8; _]` using [the `include_bytes!(...)` macro](https://doc.rust-lang.org/std/macro.include_bytes.html).

Using this approach, we want to deserialize the dictionary once, and then allow that dictionary to be read by the application for the rest of the runtime. I posit that this is a good time to use an application-global variable. Usually global state is discouraged, but since this dictionary data will never change, I argue that it is not actually application _state_.

Using [`once_cell`](https://crates.io/crates/once_cell) (the successor to [`lazy_static`](https://crates.io/crates/lazy_static)) we get a nice simple expression:

```rust
use std::rc::Rc;
use once_cell::sync::Lazy;

const DICTIONARY: Lazy<Rc<Dictionary>> = Lazy::new(|| {
    let dict_bytes = include_bytes!(concat!(env!("OUT_DIR"), "/dict.bin"));
    let dictionary: Dictionary = bincode::deserialize(dict_bytes).unwrap();

    Rc::new(dictionary)
});
```

Whenever we need to use the dictionary, we can simply `Rc::clone(&*DICTIONARY)` to get an `Rc<Dictionary>`.

## Results

```text
$ time autoruby annotate -m markdown ./test.txt ./test.md

real    0m0.359s
user    0m0.000s
sys     0m0.000s
```

Much better! The test document is 100,845 bytes, so this is a processing speed of about 280,905 bytes/second. For reference, the SQLite version took over 1m53s to annotate the same document (889 bytes/second). That's a 315x speed-up!
