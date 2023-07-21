---
title: "Storage Locations in Ethereum vs. NEAR"
date: 2021-12-21
description: "The keywords memory, storage, calldata are a big pain point for new Solidity developers. How does NEAR compare?"
author: Jacob Lindahl
twitter: sudo_build
license:
  name: CC BY-SA 4.0
  link: https://creativecommons.org/licenses/by-sa/4.0/
---

The keywords `memory`, `storage`, `calldata` are a big pain point for new Solidity developers&mdash;just look at the sheer number of [questions that have been asked](https://ethereum.stackexchange.com/questions/tagged/storage+solidity) and articles that have been written [1](https://www.geeksforgeeks.org/storage-vs-memory-in-solidity/) [2](https://solidity-by-example.org/data-locations/) [3](https://medium.com/coinmonks/ethereum-solidity-memory-vs-storage-which-to-use-in-local-functions-72b593c3703a) [4](https://dlt-repo.net/storage-vs-memory-vs-stack-in-solidity-ethereum/) about the topic, not to mention the [multiple](https://docs.soliditylang.org/en/latest/introduction-to-smart-contracts.html#storage-memory-and-the-stack), [different](https://docs.soliditylang.org/en/latest/types.html#data-location), [sections](https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html) (and [here](https://docs.soliditylang.org/en/latest/internals/layout_in_memory.html), and [here](https://docs.soliditylang.org/en/latest/internals/layout_in_calldata.html)) the Solidity documentation dedicates to the topic.

Storage locations in Solidity are no joke!

I hope to accomplish two things in this write-up:

1. Clarify the use of `storage`, `memory`, and `calldata`.
1. Introduce a more intuitive alternative to the whole idea.

{{< youtube xu8yPZQ7QL8 >}}

## Quick Explanation

Conceptually, there are basically two places that smart contract's data can live: either it's concretely stored and saved on-chain (_storage_), or it exists only during the execution of a transaction (_memory_). These could be compared to a traditional application either writing a file to disk or just putting a value in a variable: if the application (smart contract) stops running (transaction ends), the variables (_memory_) will be cleared, but the filesystem (_storage_) will remain, and when the application runs again (another transaction calls the contract), that data will still be there for use again.

(Technically, there's also a _stack_ storage location, but the Solidity compiler will handle that for you unless you write EVM assembly.)

For the most part, Solidity manages to figure out where to store variables all by itself. The only times the programmer must specify a storage location is when the data type is _complex_&mdash;usually that means a struct or dynamic array.

That covers the difference between storage and memory on a high level. For more details, check out the documentation linked previously.

What's calldata? It's like a special case of memory: when an external function receives a message call, the arguments are stored in calldata, which means they're immutable, but they also consume _slightly_ less gas than if they were in memory. It could be compared to an immutable reference to another application's memory since external message calls could potentially come from other contracts as well.

Got it? Let's run through a quick example.

## Practical Example

[Open this code sample in Remix IDE](https://remix.ethereum.org/?gist=ac0bce6c2c3c59ab979de2b179ae1e55)

```solidity
contract StorageTest {
    struct ComplexStruct {
        uint256 x;
        uint256 y;
    }

    ComplexStruct public myValue;

    function reset () public {
        myValue.x = 0;
        myValue.y = 0;
    }

    function setStruct1 (ComplexStruct calldata c) public { // 67821
        myValue = c; // copy and increment
        myValue.x = myValue.x + 1;
        myValue.y = myValue.y + 1;
    }

    function setStruct2 (ComplexStruct calldata c) public { // 66374
        // increment without copy
        myValue.x = c.x + 1;
        myValue.y = c.y + 1;
    }

    function setStruct3 (ComplexStruct memory c) public { // 67363
        myValue = c; // copy and increment
        myValue.x = myValue.x + 1;
        myValue.y = myValue.y + 1;
    }

    function setStruct4 (ComplexStruct memory c) public { // 66937
        // increment without copy
        myValue.x = c.x + 1;
        myValue.y = c.y + 1;
    }

    function getStruct () public view returns (ComplexStruct memory) {
        return myValue;
    }
}
```

(The commented-out numbers after the function signatures are the gas units consumed for executing each function, according to Remix IDE.)

Though it's not explicitly stated in the code listing, `myValue` is allocated to the contract's storage.

The first two functions (`setStruct1`, `setStruct2`) take in a struct stored in `calldata`, and thus, the more efficient of the two (`setStruct2`), is actually the most efficient in the whole contract.

`setStruct3` and `setStruct4` are identical to their N&minus;2 analogues, with the exception that they use `memory` instead of `calldata`.

Note that we could not call `setStruct1` or `setStruct2` from another function within the contract, because we cannot convert from `memory` to `calldata`:

```solidity
setStruct1(ComplexStruct({ x: 1, y: 2 }));
// TypeError: Invalid type for argument in function call. Invalid implicit conversion from struct StorageTest.ComplexStruct memory to struct StorageTest.ComplexStruct calldata requested.
```

Remember: calldata is _immutable_!

## The Alternative

This whole `memory`-`calldata` fiasco is pretty complicated. Unfortunately, there are many non-ideal design decisions still influencing the modern Solidity language. However, if you must deploy to an EVM-compatible chain, Solidity is still the language of choice. It has the best editor support, tooling, resources, and community of any other smart contract DSL.

That's a necessary qualifier&mdash;"smart contract DSL"&mdash;because, as it turns out, smart contracts can be written in general-purpose programming languages as well, even those with richer ecosystems than Solidity's.

Enter: [NEAR](https://near.org).

NEAR's virtual machine runs WebAssembly code, meaning one could conceivably write smart contracts for NEAR in any GPL with a WASM compile target. NEAR provides official SDKs for two of those languages: Rust and AssemblyScript.

Rust is a popular programming language developed by Mozilla. It's strongly typed, with a friendly compiler and an even friendlier community, and it's [the #1 most-loved programming language for six years running](https://insights.stackoverflow.com/survey/2021#technology-most-loved-dreaded-and-wanted).

AssemblyScript is a dialect of TypeScript, which is a strict superset of JavaScript. This means that traditional web2 developers can pick it up in no time!

Using a general-purpose programming language for smart contracts means that the programming paradigm is much more normalized: smart contracts merely run in the context of a regular WASM VM injected with the blockchain-specific environment globals.

Programmers don't have to specify a storage location for data anymore: variables are just normal variables, and there's an SDK for I/O to the key-value storage system.

[Check out this simple example contract](https://github.com/near-examples/counter/blob/master/assembly/main.ts), written in AssemblyScript. Permanent, on-chain storage is invoked with a put/get API, making it much more obvious what exactly is happening to the data.

If you're familiar with Rust, you may find [this full NFT implementation](https://github.com/near-examples/NFT/blob/master/nft/src/lib.rs) more interesting.

When I first encountered the NEAR ecosystem, I was stunned at how developer-friendly the contract programming interface was. In the time since then, it's only gotten better! (Not to mention the gas fees are minuscule compared to ETH: you're looking at fractions of a cent.) If you're interested in learning more about smart contract development on the NEAR ecosystem, head over to [NEAR University](https://www.near.university/) and sign up for one of the free training bootcamps.

You can find a comprehensive suite of NEAR smart contracts on the [Learn NEAR GitHub organization](https://github.com/Learn-NEAR), as well as a bevy of tutorials and examples on the [NEAR Examples GitHub origanization](https://github.com/near-examples).

Good luck!

{{% bio %}}
