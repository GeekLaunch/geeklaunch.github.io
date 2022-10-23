---
title: 'How to speed up your code 224,444,739% using graphs'
date: 2022-08-06
draft: false
description: 'Using Rust and some clever CS tricks, can we write a better algorithm than a famous YouTuber?'
---

(This article got a shout-out in [Matt Parker's follow-up video](https://youtu.be/c33AZBnRHks?t=1068). Did you know [I also make YouTube videos](https://youtube.com/c/GeekLaunch)?)

[Matt Parker](https://twitter.com/standupmaths) of [Stand Up Maths](https://www.youtube.com/standupmaths) recently uploaded a video entitled "Can you find: five five-letter words with twenty-five unique letters?," which I highly recommend you watch to understand the point of this post, the problem we're trying to solve, and the algorithm we'll be optimizing.

{{< youtube _-AfhLQfb6w >}}

In the video, he mentions that [the Python code](https://github.com/standupmaths/fiveletterworda) he wrote to solve the "five five-letter words with twenty-five unique letters" problem (or the "5-5-25" problem, for short) took 2,760,670.3 seconds (31.95 days) to run.

Let's improve on this. [My solution](https://github.com/encody/jotto-problem)&hellip;

- uses [Rust](https://www.rust-lang.org/),
- is about four times longer than Parker's,
- uses "recursion" and "graphs" _(ooh, fancy words)_ and some other fun optimizations that will probably remind you of your CS classes.

### Anagram de-duplicating

Parker mentioned this in his video. What we actually care about in this problem is finding the largest set of mutually-disjoint sets of letters that can be arranged into an English word. (The algorithm for finding such sets is similar to the [maximum disjoint set problem](https://en.wikipedia.org/wiki/Maximum_disjoint_set), and thus, so is the algorithm for solving the 5-5-25 problem.)

So, for the purposes of this problem, "beard" = "bread" = "bared".

For the remainder of this post, "word" shall refer to one of these unordered sets of letters.

### Bit packing

We could store a word as a hash set, array, or vector of characters, or a string construct, but there is an even more efficient medium: unsigned, 32-bit integers. Or rather, a _single_, unsigned, 32-bit integer.

Let's think of our integer as a list of 32 on-off switches. We can assign each letter of the alphabet to a switch (a = 0, b = 1, &hellip;), and encode a word by switching on the bits corresponding to the letters in the word. We'll have 6 bits left over, since the alphabet only contains 26 letters.

    "bread" = 0b100000000000011011 = 131099
             ...rqponmlkjihgfedcba

    "chunk" = 0b100000010010010000100 = 1057924
             ...utsrqponmlkjihgfedcba

Bitwise operations will come in handy now!

If we want to figure out if two words have any letters in common, we simply bitwise-AND them together and see if any bits are set in the output. We can create a bitmask of multiple words by bitwise-ORing them together. This functionality is implemented for [the Word struct in the solution](https://github.com/encody/jotto-problem/blob/master/src/main.rs#L153-L215).

Not only are bitwise operations useful, they're also _really freaking fast_. They're what CPUs were built for.

To calculate a solution, we'll progressively create a bitmask of the words in the solution so far.

    "bread" | "chunk" = 0b100100010010010011111 = 1189023
                       ...utsrqponmlkjihgfedcba

Then we'll check new words against the bitmask to see if they're allowed to join the partial solution.

    ("bread" | "chunk") & "witch" == 0 ? ❌
    ("bread" | "chunk") & "imply" == 0 ? ✅

### Graphs

How do we decide which words to try to add to our solution? If we try _every single word_, we end up with a brute-force solution that takes a long time ([Θ(n⁵)](https://en.wikipedia.org/wiki/Big_O_notation#Use_in_computer_science)) to complete. Let's try to be a little more clever about which words we try to add to our solution.

To do this, we'll create a [graph](<https://en.wikipedia.org/wiki/Graph_(abstract_data_type)>). Specifically, we'll be creating a [directed acyclic graph](https://en.wikipedia.org/wiki/Directed_acyclic_graph). Each node in the graph will be a word. Edges will point from a word (A) to a later word (B) when the words (A) and (B) are disjoint. Our words have a well-defined ordering (since they are just numbers), so a "later word" is a word whose 32-bit integer encoding represents a higher number.

    Node            Encoding        Edges

    "bread"         131099          ["chunk", "imply"]
    "anger"         139345          ["witch", "imply"]
    "chunk"         1057924         ["imply"]
    "witch"         4718980         []
    "imply"         16816384        []

We only need to have edges pointing to later disjoint words (and not to _all_ disjoint words) because the order of the words in the solution doesn't matter. If a solution contains word (A) and word (B), our algorithm will discover the solution regardless of which word it encounters first. Having only the single edge from (A) to (B) and not also vice-versa means that the algorithm can still discover the solution containing both (A) and (B) when it encounters (A), but when it traverses (B), it excludes (A) from future (duplicate) traversals.

Our algorithm will traverse the graph and build a solution by recursively visiting the edges of a node in the current solution candidate and returning the longest disjoint sub-solution.

In a vacuum, this algorithm would still be O(n<sup>5</sup>), but due to the nature of the data and the way we're constructing the graph (it's pretty sparse&mdash;using the test data, there is no path in the graph that contains more than 15 nodes), traversals should be O(n<sup>2</sup>) in practice.

### Short circuits

The algorithm is complete and correct at this point, but we can still speed it up with some shortcuts.

Let's add [an field to each node in our graph](https://github.com/encody/jotto-problem/blob/master/src/main.rs#L122) that tells us the length of the longest possible path after this node. If our search needs 3 more words and it encounters a node that says its longest path only contains 1 more node, our search can skip that node early.

We can also maintain [a set of word combinations](https://github.com/encody/jotto-problem/blob/master/src/main.rs#L20-L34) that we have already tried and failed to use in a solution.

### Compiler Options

Since we only care about the runtime of this program, we can have the compiler optimize the heck out of it:

```toml
[profile.release]
lto = true
codegen-units = 1
panic = "abort"
```

## Final Product

    $ time ./target/release/jotto-problem

    [solutions output]

    Found 537 solutions that are 5 words long

    ________________________________________________________
    Executed in    1.23 secs    fish           external
       usr time    1.28 secs    0.14 millis    1.28 secs
       sys time    0.04 secs    1.05 millis    0.04 secs

Not bad for a laptop!

Try it for yourself:

- Install [Rust](https://www.rust-lang.org/tools/install)
- Download the [English word list](https://github.com/dwyl/english-words)
- Download the [source code](https://github.com/encody/jotto-problem)
- Update [the `PATH` variable in main.rs](https://github.com/encody/jotto-problem/blob/master/src/main.rs#L4) to the location where you saved the word list
- Run `./build-and-run.sh` in your terminal

## References

- [Can you find: five five-letter words with twenty-five unique letters?](https://www.youtube.com/watch?v=_-AfhLQfb6w)
- [Modeling graphs in Rust using vector indices](https://smallcultfollowing.com/babysteps/blog/2015/04/06/modeling-graphs-in-rust-using-vector-indices/)
- [Creating an Iterator in Rust](https://aloso.github.io/2021/03/09/creating-an-iterator)
- [Five Clique](https://gitlab.com/bpaassen/five_clique/-/tree/main/)

{{% bio %}}
