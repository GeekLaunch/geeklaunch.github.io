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

TODO: check compilation

```rust
use near_sdk::{
    PromiseError, PromiseOrValue,
    env, ext_contract, near,
};

#[ext_contract(ext_transmogrifier)]
trait Transmogrifier {
    fn transmogrify(&mut self, some_input: u32) -> u32;
}

#[near]
struct FrobnicateCallbackContext {
    value: u32,
}

#[near]
impl MyContract {
    pub fn frobnicate(&mut self) -> PromiseOrValue<bool> {
        // ...

        PromiseOrValue::Promise(
            ext_transmogrifier::ext(self.transmogrifier_account_id.clone())
                .with_static_gas(/* minimum gas */)
                .transmogrify(42)
                .then(
                    Self::ext(env::current_account_id())
                        .with_static_gas(/* minimum gas */)
                        .frobnicate_callback(FrobnicateCallbackContext {
                            value: 42,
                        })
                )
        )
    }

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

#### Caller signature

The return value of `frobnicate` is `PromiseOrValue<bool>`. This is purely up to taste, but I find it useful as a hint of the type that the receipt chain eventually resolves with, even if the function always returns a promise.

#### Callee and callback gas

When attaching gas to cross-contract calls, there are two values to play with: _static gas_ and _gas weight_. Static gas is the guaranteed minimum amount of gas that will be made available to the receipt. If that much gas is not available to the caller, the current receipt will reject. If, after distributing the static gas to all produced receipts, there is still gas remaining, it will be distributed to the receipts proportionally based on their gas weight. All produced receipts have a default gas weight of `1`, meaning they will all receive the same share of leftover gas. However, if the gas weight is set to `0`, the receipt will not receive any leftover gas. I recommend testing the functions you plan to call to discover the minimum amount of gas necessary to complete the calls. Gas consumption is a bit difficult to predict, so practical testing is probably the safest bet.

#### Callback naming

The foreign call is encapsulated by the call to `frobnicate` before and `frobnicate_callback` after. I recommend the `[name]`/`[name]_callback` naming scheme for entry/callback function pairs. For longer interaction chains, consider indexing and labeling the callbacks (e.g. `mint_callback_2_receive_oracle`). For more complex interaction chains, consider referencing the logic branch in the callback if an index doesn't make sense (e.g. `mint_callback_no_nft_receive_oracle`).

TODO: check max method name length

#### Protecting callbacks

Callback functions should never be entry points, so they should always be labeled with `#[private]`. This decorator simply adds the check that the predecessor account ID is equal to the current (executing) account ID. In other words, it ensures that the call was initiated by the contract itself (via a callback or external signature).

#### Callback arguments

The callback function deserializes its arguments as Borsh. This is context- and developer-dependent, but it is potentially a cost-saving technique at the expense of human readability of receipts. Additionally, since callbacks may end up accepting a variety of arguments, I recommend packing them into a struct (`FrobnicateCallbackContext`) to avoid mistaking argument ordering.

#### Handling callback results

The promise result is accepted as an argument to the callback using `#[callback_result]`. Another decorator&mdash;`#[callback_unwrap]`&mdash;also exists, but it does not give the developer as much control over how failure cases are handled. Again, a context-dependent decision.

### Account keys

Zero or more access keys may be attached to a NEAR account, in addition to zero or one smart contract. Access keys are either _full-access_ or _function call_ keys. Full access keys may sign transactions containing any of the 9 (TODO: check number) NEAR operations[^nearops] acting upon the associated NEAR account. Function call keys may only sign transactions containing the `FunctionCall` action.

[^nearops]: `AddKey`, `DeleteKey`, `CreateAccount`, `DeleteAccount`, `Transfer`, `Deploy`, `FunctionCall`, `Stake`, `DelegateCall` TODO: check

Function call keys are additionally parameterized:

- With a target account ID. The key may only sign interactions where the receiver is this account. A target account ID is required (TODO: check).
- With a list of method names. The key may only sign interactions where the invoked function matches one of these names. This restriction is optional.
- With a gas limit. The total amount of gas consumed by all transactions signed by the key must remain below this limit. This restriction is optional.

Note that an account may have keys _and_ a contract deployed simultaneously. As of the time of writing, smart contracts cannot inspect the access keys deployed to an account. The best that you can do is `env::signer_account_pk()` to retrieve the public key used by the signer of the transaction. However, this does not reveal whether the key used was a full-access or function call key.

Function call keys allow a user to give dapps _private_ keys that have extremely limited access to the user's account. This way, the user can use the dapp uninterrupted by "Sign Transaction" prompts, but with the assurance that the dapp cannot freely manipulate his portfolio (function call keys cannot transfer NEAR, even as an attached deposit to a function call). Therefore, if a contract wishes to encourage the user to take a second look at the transaction, it can enforce the transfer of 1 yoctoNEAR (the smallest indivisible unit of NEAR). This prevents the interaction from being signed directly by a function call key.[^oneynfc]

[^oneynfc]: Technically, it is possible for the user to deploy a contract to their own account, and then issue a reflexive function call key.

### Numbers

- Arithmetic overflow
- Large integer serialization

### Cross-contract calls

- Gas
- Argument serialization in callbacks
- Callback protection
- Writing `#[ext_contract(...)]` traits to be maximally flexible

### Serialization

- Newtypes & wrappers

### Working with NEP standards

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
