---
title: "NEAR Smart Contract Security"
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

Therefore, rather than regurgitate tired principles well-visited elsewhere, I shall provide practical advice from my own experience in the effective development of NEAR smart contracts.

## Security

### Numbers

- Arithmetic overflow
- Large integer serialization

### Cross-contract calls

- Gas
- Argument serialization in callbacks
- Callback protection
- Writing ext_\* traits to be maximally flexible

### Serialization

- Newtypes & wrappers

### Working with NEP standards

### Constructors

### Storage

- SDK collections
- Prefixing & storage keys
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

## Optimization

### Avoiding `.unwrap()`

### Being conscious of dynamic allocations

- Thrashing the allocator
- String operations

### Ditching the SDK

### Custom JSON deserialization

### Post-compilation WASM blob
