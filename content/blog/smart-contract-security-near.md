---
title: "Smart contract security: NEAR"
date: 2024-07-18T00:00:00+09:00
draft: true
# lastmod: 2024-07-17
description: "Good practices for writing NEAR smart contracts"
author: Jacob Lindahl
twitter: sudo_build
math: true
license:
  name: CC BY-SA 4.0
  link: https://creativecommons.org/licenses/by-sa/4.0/
---

I have extensive experience with writing secure smart contracts for the NEAR blockchain. Throughout my tenure at [NEAR Foundation](https://near.foundation/) and [Pagoda](https://www.pagoda.co/), I have accumulated over three years of experience with the platform, having contributed to core libraries and security-critical features.

Among my experience are:

- Author of the library [near-sdk-contract-tools](https://github.com/near/near-sdk-contract-tools), a security-first library that implements many of the NEAR contract standards, [audited by Kudelski Security](https://github.com/near/near-sdk-contract-tools/blob/develop/documents/NEAR%20Contract%20Tools%20-%20Final%20-%2005.05.2023.pdf).
- Technical lead on [the native USDC integration with NEAR Protocol](https://near.org/blog/usdc-launches-natively-on-the-near-protocol), where I assisted the Circle team in writing the USDC on NEAR smart contract and performed an internal audit.
- Internal audits for several other partner smart contracts.
- Primary author of the [Nuffle Labs](https://nuff.tech/) (formerly NEAR Data Availability) [blob store smart contract](https://github.com/Nuffle-Labs/data-availability/tree/main/contracts/blob-store).
- Author of the NEAR Multichain [gas station](https://github.com/near/multichain-gas-station-contract/tree/master/gas_station) and [NFT chain key](https://github.com/near/multichain-gas-station-contract/tree/master/nft_key) smart contracts.
- [Secureum](https://www.secureum.xyz/) graduate.

Besides these, I have assisted countless community members and ecosystem projects with smart contract authorship and security-related topics, including holding seminars, performing code reviews, and providing technical support.

---

When writing smart contracts on NEAR, many of the same general principles apply as do when writing Solidity smart contracts:

- Validate all your inputs.
- Don't trust users to act honestly or smart contracts to be implemented correctly.
- Beware of invalid intermediate state.[^cei]
- [&hellip;and so on.]({{< ref "blog/modern-dearth-of-intelligent-crypto#the-well-tempered-contract-developer" >}})

[^cei]: This is a generalization of the concept Solidity developers know as a "reentrancy" vulnerability, usually addressed by the [_Checks-Effects-Interactions_ order of operations](https://docs.soliditylang.org/en/latest/security-considerations.html#reentrancy).

Therefore, rather than regurgitate tired principles well-visited elsewhere, I shall provide specific, practical advice from my own experience in the effective development of NEAR smart contracts.

## Security

### Asynchronous cross-contract calls

From the perspective of a smart contract, NEAR's sharding is mostly abstracted away. Transaction execution is broken down into receipts, each of which operates in the context of a single account. This allows the network to streamline consensus on the outcome of each receipt, since it can only access the target account's storage and not that of the entire blockchain.

However, smart contracts still need the ability to compute based on information from other smart contracts. Whereas EVM-compatible blockchains use a synchronous execution model (execution flow passes from the caller contract to the callee contract and back within a transaction&mdash;a "unit of consensus"), NEAR's receipt model reaches consensus every time execution flow passes outside of the current receipt.

Therefore, while a "reentrancy attack" does not have a perfect equivalent in the NEAR execution paradigm _per sé_, an analogue does exist: that of invalid intermediate state, leaving a smart contract in a vulnerable state between the invocation and resolution of an asynchronous cross-contract call. However, with the understanding that all cross-contract interactions produce discrete receipts, I hope that these kinds of vulnerabilities are easier to spot.

When writing a cross-contract interaction, I recommend following this pattern:

```rust
use near_sdk::{
    env, ext_contract, near, AccountId, Gas, PromiseError, PromiseOrValue,
};

#[ext_contract(ext_transmogrifier)]
trait Transmogrifier {
    fn transmogrify(&mut self, some_input: u32) -> u32;
}

#[near]
pub struct FrobnicateCallbackContext {
    value: u32,
}

#[near(contract_state)]
pub struct MyContract {
    transmogrifier_account_id: AccountId,
}

#[near]
impl MyContract {
    pub fn frobnicate(&mut self) -> PromiseOrValue<bool> {
        // ...

        PromiseOrValue::Promise(
            ext_transmogrifier::ext(self.transmogrifier_account_id.clone())
                .with_static_gas(todo!(/* minimum gas */))
                .transmogrify(42)
                .then(
                    Self::ext(env::current_account_id())
                        .with_static_gas(Self::FROBNICATE_CALLBACK_GAS)
                        .frobnicate_callback(FrobnicateCallbackContext {
                            value: 42,
                        }),
                ),
        )
    }

    const FROBNICATE_CALLBACK_GAS: Gas = Gas::from_tgas(5);

    #[private]
    pub fn frobnicate_callback(
        &mut self,
        #[serializer(borsh)] context: FrobnicateCallbackContext,
        #[callback_result] result: Result<u32, PromiseError>,
    ) -> bool {
        // some contrived condition...
        result.is_ok_and(|value| value == context.value)
    }
}
```

#### Describing foreign contract interfaces

Using the NEAR SDK, cross-contract calls are primarily constructed in one of two ways: using ad-hoc promise construction via [`Promise::function_call`](https://docs.rs/near-sdk/latest/near_sdk/struct.Promise.html#method.function_call) or using a trait decorated with [`#[ext_contract]`](https://docs.rs/near-sdk/latest/near_sdk/attr.ext_contract.html) (in the listing above). I typically recommend the latter approach, as it is more type-safe. However, traits that are easy-to-use to construct `Promise`s when decorated with `#[ext_contract]` can be cumbersome to target in `impl` blocks, and vice-versa, particularly when it comes to returning `Promise`s. Therefore, it may be preferable to split an interface into an "implementable" trait and "callable" trait pair.

#### Caller signature

The return value of `frobnicate` is `PromiseOrValue<bool>`. This is purely up to taste, but I find it can be useful as a hint of the type to which the promise chain eventually resolves, even if the function always returns a promise.

#### Callee and callback gas

{{%collapse title="Reference"%}}

- ["Gas (Execution Fees)" on docs.near.org](https://docs.near.org/concepts/protocol/gas)
{{%/collapse%}}

When attaching gas to cross-contract calls, there are two values to play with: _static gas_ and _gas weight_. Static gas is the guaranteed minimum amount of gas that will be made available to the promise. If that much gas is not available to the caller, the current call will reject. If, after distributing the static gas to all produced promises, there is still gas remaining, it will be distributed to the promises proportionally based on their gas weight. All promises have a default gas weight of `1`, meaning they will all receive the same share of leftover gas. However, if the gas weight is set to `0`, the promise will not receive any leftover gas. I recommend testing the functions you plan to call to discover the minimum amount of gas necessary to complete the calls. Gas consumption is a bit difficult to predict, so I recommend practical testing.

At the same time, gas limits are not a substitute for proper security practices, and can even be a source of problems if gas conditions unexpectedly change:

- The protocol could update the cost of different VM actions.
- Third-party contracts could get updated.
- Workloads could be unexpectedly large or small.

Of course, running out of gas causes issues for users or callers. On the other hand, if gas limits are the primary security factor in a cross-contract call, unforeseen drops in gas usage would invalidate those assumptions.

#### Callback naming

The foreign call is encapsulated by the call to `frobnicate` before and `frobnicate_callback` after. I recommend the `[name]`/`[name]_callback` naming scheme for entry/callback function pairs. For longer interaction chains, consider indexing and labeling the callbacks (e.g. `mint_callback_2_receive_oracle`) for ease of debugging. For more complex interaction chains, consider referencing the logic branch in the callback if an index doesn't make sense (e.g. `mint_callback_no_nft_receive_oracle`).[^max_length_method_name]

[^max_length_method_name]: The maximum method name length on mainnet is [256](https://hopp.sh/r/AaSe3ssRWfPo).

#### Protecting callbacks

Callback functions should never be entry points, so they should always be labeled with `#[private]`. This decorator simply adds the check that the predecessor account ID is equal to the current (executing) account ID. In other words, it ensures that the call was initiated by the contract itself (via a callback or external signature).

#### Callback arguments

The callback function deserializes its arguments as [Borsh](https://borsh.io/). This is context- and developer-dependent, but it is potentially a cost-saving technique at the expense of human readability of receipts. Additionally, since callbacks may end up accepting a variety of arguments, I recommend packing them into a struct (`FrobnicateCallbackContext`) to avoid mistaking argument ordering.

#### Handling callback results

The promise result is accepted as an argument to the callback using `#[callback_result]`. Another decorator&mdash;`#[callback_unwrap]`&mdash;also exists, but it does not give the developer as much control over how failure cases are handled. Again, a context-dependent decision.

#### Trusting implementations

Just because a contract is deployed on chain doesn't mean that it is implemented properly or that it is guaranteed to follow any sort of standard. In fact, many contracts may _look_ like they implement a certain standard, only for the implementation to have unexpected quirks or be flat-out wrong. This can be accidental or intentional&mdash;even malicious!

Don't assume that a contract implements a standard correctly simply by virtue of its appearance.

#### Race conditions

While reentrancy is less of an issue on NEAR (or, arguably, even impossible) because of the asynchronous execution model, it exchanges one problem for another: asynchronous transactions have to deal with race conditions.

Imagine an NFT-gated contract. One way to implement this restriction would be for the contract to check the owner of the NFT before executing an action. However, this check alone is insufficient, because it is possible for the NFT to be transferred away from the user in between the ownership check and the execution of the action. So, it might be better to implement NFT-gating via locking, escrow, or temporary transfers.

### Account keys

{{%collapse title="Reference"%}}

- ["Access Keys" on docs.near.org](https://docs.near.org/concepts/protocol/access-keys)
- ["Anatomy of a Transaction &#x2023; Actions" on docs.near.org](https://docs.near.org/concepts/protocol/transaction-anatomy#actions)
{{%/collapse%}}

Zero or more access keys may be attached to a NEAR account, in addition to zero or one smart contract. Access keys are either _full-access_ or _function call_ keys. Full access keys may sign transactions containing any of the 9 NEAR operations[^nearops] acting upon the associated NEAR account. Function call keys may only sign transactions containing the `FunctionCall` action.

[^nearops]:

    1. `CreateAccount`
    2. `DeleteAccount`
    3. `AddKey`
    4. `DeleteKey`
    5. `Transfer`
    6. `DeployContract`
    7. `FunctionCall`
    8. `Stake`
    9. `DelegateActions`

Function call keys are additionally parameterized:

- With a target account ID (`receiver_id`). The key may only sign interactions where the receiver is this account. A target account ID is required.
- With a list of method names (`method_names`). The key may only sign interactions where the invoked function matches one of these names. This restriction is optional.
- With a gas limit (`allowance`). The total amount of gas consumed by all transactions signed by the key must remain below this limit. This restriction is optional.

Note that an account may have keys _and_ a contract deployed simultaneously. As of the time of writing, smart contracts cannot inspect the access keys deployed to an account. The best that you can do is `env::signer_account_pk()` to retrieve the public key used by the signer of the transaction. However, this does not reveal whether the key used was a full-access or function call key.

Function call keys allow a user to give dapps _private_ keys that have extremely limited access to the user's account. This way, the user can use the dapp uninterrupted by "Sign Transaction" prompts, but with the assurance that the dapp cannot freely manipulate his portfolio (function call keys cannot transfer NEAR, even as an attached deposit to a function call). Therefore, if a contract wishes to encourage the user to take a second look at the transaction, it can enforce the transfer of 1 yoctoNEAR (the smallest indivisible unit of NEAR). This prevents the interaction from being signed directly by a function call key.[^oneynfc]

[^oneynfc]: Technically, it is possible for the user to deploy a contract to their own account, and then issue a reflexive function call key.

### Numbers

#### Integer overflow

Rust's primitive integer data types use a set number of bits to store information. These types define a range of values (e.g. `0..256` for `u8`) that the type can represent. Any values outside of this range cannot be represented. If a calculation would result in a value outside of the representable range, "overflow" will occur, wherein the information that requires additional bits to represent is lost.

Overflow is of great concern to smart contracts, since it is usually perceived as an edge case that probably won't ever happen. This means that if it _does_ happen, the result is usually disastrous.

Rust can be configured to panic (reject the transaction) if an overflow is encountered by including the following in `Cargo.toml`:

```toml
[profile.release]
overflow-checks = true
```

It may not always be desired for the contract to immediately panic and exit upon encountering an overflow, rather for it to be handled a bit more gracefully. In such cases, use [`<integer>::checked_add`](https://doc.rust-lang.org/std/primitive.i8.html#method.checked_add), [`<integer>::saturating_add`](https://doc.rust-lang.org/std/primitive.i8.html#method.saturating_add), and the corresponding functions for other arithmetic operations (`sub`, `mul`, `div`).

#### Large integer serialization

The conventional serialization format for function call arguments is JSON. However, JavaScript doesn't support integers beyond 53 bits, and since JavaScript is an extremely common language for interfacing with NEAR, Rust smart contracts that need to interface with JavaScript should serialize 64-bit and 128-bit integers differently.

The NEAR SDK provides [the `json_types` module](https://docs.rs/near-sdk/latest/near_sdk/json_types/index.html) containing, among other items, wrapper types that cleanly implement string serialization for 64-bit and 128-bit signed and unsigned integers (`I64`, `U64`, `I128`, `U128`).

### Serialization

Speaking of serialization, smart contracts deal with many different forms of data, not all of which might be easily serializable into JSON (via `serde`) or Borsh. Particularly when using data types from a third-party crate, this can be an issue.

[Rust disallows implementations of foreign traits on foreign types](https://doc.rust-lang.org/book/ch10-02-traits.html#implementing-a-trait-on-a-type). Thus, we create a new wrapper type around the type we wish to serialize, for instance:

```rust
pub struct MyWrapper(pub Inner);

impl near_sdk::serde::Serialize for MyWrapper {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: near_sdk::serde::Serializer,
    {
        serializer.serialize_str(&self.0.to_string())
    }
}

impl<'de> near_sdk::serde::Deserialize<'de> for MyWrapper {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: near_sdk::serde::Deserializer<'de>,
    {
        let s = <String as near_sdk::serde::Deserialize>::deserialize(
            deserializer,
        )?;
        Self::from_str(&s).map_err(near_sdk::serde::de::Error::custom)
    }
}
```

### Working with NEP standards

We won't go through every single different contract standard here, just a few common ones. Many standards share design considerations, so some things said here may apply elsewhere.

#### Storage Management

{{%collapse title="Reference"%}}

- ["Storage Management" on nomicon.io](https://nomicon.io/Standards/Tokens/FungibleToken/Core)
- [NEP-145 text on github.com][nep145]
{{%/collapse%}}

When coming from a platform like Ethereum, NEAR's storage fees are possibly the third-most likely aspect of the protocol to trip up a new developer, after the account model and async execution.

Simply put, NEAR _locks_ (prevents from being used or transferred) a portion of an account's NEAR balance in proportion with the amount of storage the account consumes. There are some exceptions that arise, particularly with the introduction of [NEP-448 Zero-balance Accounts](https://github.com/near/NEPs/blob/master/neps/nep-0448.md), but this is essentially how the system works.

This introduces the subtle possibility for a contract to become soft-locked, wherein it attempts to consume more storage than it can afford, given its current balance, and thus interactions with the contract fail. An attacker can easily leverage this to brick an unprotected contract if there is a way to quickly increase the storage usage of the contract. A simple example would be a guest book contract which allows users to store arbitrary amounts of text in the contract's storage. If users are not proactively charged for the amount of storage they consume on the contract, it could quickly become soft-locked. Of course, the problem is trivially and temporarily solved simply by sending the contract account more NEAR, but an attacker might then simply continue their attack.

[NEP-145][nep145] is a standardized solution to this problem. It introduces a storage credit system which a user can first credit and later debit when performing functions on the contract that consume storage. The key point to acknowledge about this system is that it places the responsibility for managing storage fees squarely upon the shoulders of the smart contract developer. There are a few implementations ([near-contract-standards](https://docs.rs/near-contract-standards/latest/near_contract_standards/storage_management/index.html), [near-sdk-contract-tools](https://docs.rs/near-sdk-contract-tools/latest/near_sdk_contract_tools/standard/nep145/index.html)) that developers may find useful to use or reference in their own implementations.

[nep145]: https://github.com/near/NEPs/blob/master/neps/nep-0145.md

Particularly sticky can be correctly implementing storage fees during cross-contract calls. I would caution against recording the storage consumption of the contract at the beginning of a call chain and charging the user for the difference at the end, since asynchronous execution would allow other writes to the contract in the middle of the chain&mdash;a textbook race condition. Rather, I would recommend making minimal writes anywhere other than the final callback of the chain. These minimal writes are ideally both reversible (and reversed in the final callback if there is a failure) and primarily account for in-flight locks (of assets or other values). Then, during the final callback, large, space-consuming writes may occur, making accounting trivial.

There is also the option of attempting to charge the storage fee up-front by calculating the amount of storage that _will be_ consumed. However, this can be even more difficult to get right than the process described above. The NEAR SDK collections serialize values with Borsh, which may include metadata such as sequence lengths. Additionally, the collections usually need to store a small amount of indexing data (such as key locations for iterable maps). Therefore, I recommend performing storage accounting at the _end_ of promise chains in all but the most exceptional cases.

#### Fungible tokens

{{%collapse title="Reference"%}}

- [NEP-141 guide on nomicon.io](https://nomicon.io/Standards/Tokens/FungibleToken/Core)
- [NEP-141 text on github.com](https://github.com/near/NEPs/blob/master/neps/nep-0141.md)
{{%/collapse%}}

Fungible token contracts on NEAR are typically composed of a few different standards, including the storage management standard [described previously](#storage-management):

- NEP-141 for core functionality: balance sheet, events, and transferability.
- NEP-148 for token metadata: provides a single function to retrieve metadata such as name, symbol, decimals, icon, etc.

It is exceedingly rare to encounter a smart contract that implements either one of NEP-141 or NEP-148 without the other.

First, and as always, when interacting with a foreign smart contract (essentially, any contract other than the one you're currently writing), _do not assume_ that the contract is implemented: correctly, as it appears on GitHub, or as it was last week. Your contract must only accept strictly _valid_ inputs, and not rely on other entities to perform input validation.

So, as well as you understand, for example, the fungible token set of standards, you cannot rely on other contracts' authors to follow them, either out of ignorance or malice.

As [slime](https://twitter.com/slimedrgn) put it:

> If you're working with third-party tokens, especially without a token whitelist, you should keep in mind that the token owner can just send `ft_on_transfer` with 1000000000 tokens, change `ft_balance_of` to always return `1000`, `0`, `-1`, `"slime"`, panic, or do other random stuff, so 1 malicious or weird-behaving token shouldn't affect the whole contract.

This is especially salient for token standards. It's one thing if your UI fails to parse metadata and can't load the token icon. It's another if your AMM accidentally refunds a deposit.

Things can get prickly when working with `ft_transfer_call`. Whereas in EVM ecosystems, tokens are transferred between contracts by having the owner first approve the contract as a transfer agent, and then the contract can perform the transfer itself, NEP-141 allows contracts to directly attach tokens to function calls. The function call can be additionally parameterized via the `msg` argument of `ft_transfer_call`. Typically, this takes the form of a simple command word or a JSON string.

`ft_transfer_call` calls `ft_on_transfer` on the receiving account, forwarding the `msg` parameter. The receiving contract can perform arbitrary operations (including additional cross-contract calls) before returning a stringified integer to the calling token contract. This integer represents the number of tokens that the receiving contract is refunding to the sender. I think this is the biggest design flaw in the standard, for two reasons:

1. It introduces a race condition wherein the sending account is deleted between the time when the tokens were sent and when they were refunded (since they occur in different receipts). Handling this race condition increases the complexity of implementing the standard.
2. It makes it very difficult for the receiver to provide feedback to the sender. While the sender can easily send additional information to the receiver via the `msg` parameter, the receiver has no such easy way to communicate with the sender.

Although, it is entirely without merit, in that the receiver does not have to initiate yet another cross-contract call to return excess tokens, saving some gas.

My last point on fungible token contracts is good practice for all cross-contract interactions: check the predecessor. Too often I have audited contracts which expect to only be interacting with one other contract, and they don't check the predecessor. For example, an escrow contract that only operates on USDC, but the `ft_on_transfer` function looks like this:

```rust
pub fn ft_on_transfer(
    &mut self,
    sender_id: AccountId,
    amount: U128,
    msg: String,
) -> U128 {
    let current_deposit: u128 = self.deposits.get(&sender_id).unwrap_or(0);
    // Who cares about overflow; USDC is implemented correctly!
    self.deposits.insert(sender_id, current_deposit + amount.0);

    U128(0)
}
```

Of course, this means that anyone can call this function&mdash;and not just NEP-141 contracts either&mdash;_anyone_!

#### Non-fungible tokens

{{%collapse title="Reference"%}}

- [NEP-171 guide on nomicon.io](https://nomicon.io/Standards/Tokens/NonFungibleToken/Core)
- [NEP-171 text on github.com](https://github.com/near/NEPs/blob/master/neps/nep-0171.md)
{{%/collapse%}}

### Constructors

### Storage

- SDK collections
- Prefixing & storage keys
- Default struct storage key "STATE"
- Deleting collections
- Avoiding soft-locking

### Writing tests

- `near-workspaces`, dynamic compilation

### Enforcing before and after invariants with predicates

### Calculating refunds

### Feature flags

### Forcing signatures from a full-access key

- (or contract)
- Smart contract VM doesn't currently provide access key inspection

### ABI

### Source code verification

### Upgrading & state migration

## Optimization

### Avoiding `.unwrap()`

### Being conscious of dynamic allocations

- Thrashing the allocator
- String operations

### Ditching the SDK

### Custom JSON deserialization

### Post-compilation WASM blob
