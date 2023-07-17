---
title: "The modern dearth of intelligent crypto"
date: 2022-11-13
draft: false
description: "Save yourself billions of dollars with these security tips"
author: Jacob Lindahl
twitter: sudo_build
license:
  name: CC BY-SA 4.0
  link: https://creativecommons.org/licenses/by-sa/4.0/
---

## First, a quick word on recent events

The original inspiration for writing on this topic was the [Skyward smart contract hack](https://twitter.com/skywardfinance/status/1587947957789331457) for ~$3 million (at the time of the hack). However, since then, [the FTX insolvency crisis](https://twitter.com/SBF_FTX/status/1591089317300293636) occurred, so I've reworked and added some material to be more broadly applicable to the blockchain industry as a whole.

It's understandable to be uncomfortable, or even _scared_ right now. Unregulated, fast-moving markets aren't appropriate for everyone, especially when working with money one can't afford to lose.

## The blockchain promise

Wasn't crypto supposed to solve all the problems of the financial systems of yesterday? It was supposed to be trustless, and mathematically impossible to break! It seems like crypto has the same problems that Wall Street has, but now they're Internet-connected, worldwide, and taking advantage of the average consumer. Worse, there are no repercussions for the masterminds behind each shoddy operation: they get off scot-free to enjoy their ill-gotten riches in exotic locations from which they can't be extradited.

What went wrong?

Let's go back to the original promise of blockchain.

The first line of Satoshi Nakamoto's paper introducing Bitcoin reads:

> Commerce on the Internet has come to rely almost exclusively on financial institutions serving as trusted third parties to process electronic payments.[^bitcoin]

[^bitcoin]: [Bitcoin: A Peer-to-Peer Electronic Cash System](https://bitcoin.org/bitcoin.pdf)

We need read no further to already see a problem: the use of a centralized cryptocurrency exchange (such as FTX) is already in conflict with _the_ principle upon which the entirety of cryptocurrency was founded. Of course, I'm not saying that centralized exchanges, lenders, banks, and their ilk (hereafter referred to as "centralized finance" or "CeFi") should not exist, but that they still exist in the "trusted third party" paradigm of financial institutions.

The promise of blockchain-based cryptocurrencies was that it was possible to conduct finance independent of any trusted third party, and thence comes the "trustless" word that the cryptosphere likes to throw around.

So, we have two financial paradigms: "trusted" and "trustless". FTX and Binance, J.P. Morgan Chase Bank and BlackRock, RobinHood and Fidelity&mdash;all of centralized finance exists in the former. Trades and asset holdings are mediated and managed by these entities, and their customers _trust_ them to uphold their terms of service.

An excerpt from the FTX Terms of Service:

> (B) None of the Digital Assets in your Account are the property of, or shall or may be loaned to, FTX Trading; FTX Trading does not represent or treat Digital Assets in User’s Accounts as belonging to FTX Trading.
>
> (C) You control the Digital Assets held in your Account. At any time, subject to outages, downtime, and other applicable policies (including the Terms), you may withdraw your Digital Assets by sending them to a different blockchain address controlled by you or a third party.[^ftxtos]

[^ftxtos]: [FTX Terms of Service (Archive.org)](https://web.archive.org/web/20221113001311/https://help.ftx.com/hc/en-us/article_attachments/9719619779348/FTX_Terms_of_Service.pdf)

We see here the contravention of the premise of Bitcoin: a reliance on trusted, third-party financial institutions has returned. Or, maybe it never really left?

Unfortunately, the drawbacks of centralized finance are still present in centralized _cryptocurrency_ finance. It's just that this time, the centralized entities are not regulated or insured.

Human nature hasn't changed: where there's dishonest money to be made, dishonest money will be made.

## Not the solution, yet

We've seen the downfall of centralized finance time and time again. FTX is just the biggest and most recent domino to fall.

As any cryptobro would quickly tell you, the solution is DeFi!

(*De*centralized finance, for the uninitiated.)

Instead of using a trusted person or company as the intermediary, DeFi systems are built around smart contracts&mdash;bits of code that run independently on the blockchain, and always, only do _exactly_ what they are programmed to do. Nothing more, nothing less. They can't break their terms of service, because they _are_ their own terms of service. A smart contract is the description and execution of its own behavior, inextricably unified.

Sounds like the perfect solution!

In a way, it is. Many DeFi platforms like Uniswap, 1inch, have been fairly successful thus far in fulfilling their value prop. However, swapping LPs is not the whole story of DeFi:

{{< tweet user="chainalysis" id="1580312145451180032" >}}

If you look at the monthly chart in the above tweet, you'll see that the Y-axis is demarcated in units of $200 millions per month, with the most recent figure (October) coming in at $718 million.

Sure, it's notable that FTX, an industry stalwart up to this point, has experienced such a violent and cataclysmic tumble from grace, with preliminary estimates of their liabilities ranging from [$1 billion](https://www.reuters.com/markets/currencies/exclusive-least-1-billion-client-funds-missing-failed-crypto-firm-ftx-sources-2022-11-12/) to [$10 billion](https://www.theverge.com/2022/11/10/23451484/ftx-customer-funds-alameda-research-sam-bankman-fried), but DeFi hacks account for that much over the course of a month or few, while seeing more than an order of magnitude _less_ volume.[^volume]

[^volume]: At the time of writing, CoinGecko reports [all exchanges](https://www.coingecko.com/en/exchanges) as seeing $53.2 billion of volume over the last 24 hours, while [decentralized exchanges](https://www.coingecko.com/en/exchanges/decentralized) have only seen $2.27 billion.

Whether this is a fair comparison to make is up to you. I'll be the first to admit that I'm a programmer, not a financial analyst. However&hellip;

I'm a programmer, not a financial analyst.

## Breach of smart contract

Usually, when it comes to failures in the traditional finance space, there are governments or at least insurance companies to fall back on. (Obviously, the centralized crypto exchanges have yet to be as thoroughly regulated and insured as other, more established institutions, but let there be no doubt: the regulation will come.) Eventually, consumers will be protected against institutional failures like FTX (even if they aren't today).

DeFi, on the other hand, does not come with any such safety net. You get the contract, and that's it. You read the contract, _trust_[^trustless?] the contract, and interact with it based on your understanding of what the contract will do. Herein lies the conundrum: of course, very few DeFi users will actually take the time to thoroughly read and understand every smart contract with which they interact (myself included 😰), which means they're *trust*ing the smart contract developer knows what he's doing.

[^trustless?]: Ironic.

By and large, the numbers speak for themselves: that trust is misplaced.

That's a bit of a problem.

It can be addressed in three ways:

1. **Regulation**. This injects a trusted third party (government) into every transaction, yet again violating the premise and the promise.
2. **Educating the users**: teaching them how to read smart contracts, understand security vulnerabilities, and accurately estimate financial valuations. This is the most noble effort. If you figure out how to make users smarter, please share! Every software engineer would thank you.\
   Long-term, I think this should be the goal, but it is lofty and idealistic. Realistically, this will probably take the form of well-known auditing firms whose "seals of approval" will be well-recognized by the average user.
3. **Educating the developers**. Luckily, developer education is something in which dApp platforms hold a great deal of sway, and in which they can make great strides. Eventually, this will probably take the form of libraries in which nearly every conceivable DeFi pattern is already implemented, and the developers just need to learn how to use them.

(Of course, no system is perfect, so insurance, legislation, and other band-aid solutions will come into play when the primary system fails, but for now, let's focus on making sure the primary system doesn't fail.)

## The well-tempered contract developer

I'm going to do my best to make each of these points as protocol-agnostic as possible, but some specifics may leak through.

### Don't trust your users

[Trustlessness goes both ways](https://youtu.be/k8Udcffrexw?t=24).

If we have (or rather, [have not](https://owasp.org/Top10/A03_2021-Injection/)) learned anything from web 2, it's that you should sanitize your database inputs.

Crypto is the wild, wild west. Entities that interact with your smart contract will understand your contract if they're doing their due diligence, and may understand it even better than you, the developer, do.

Do not trust your users. Do not trust that their input will be well-formed. Do not trust that they will only try to withdraw an asset they own, or from their own account. Do not trust that they will deposit an asset or quantity you expect them to, or that they told you they would. Do not trust that two different accounts are not controlled by the same entity. Do not trust that a contract invocation is not coming from the same contract (does re-entrancy sound familiar to anyone?).

Do not trust that your users will be reasonable.

Do not trust.

### Don't trust other smart contracts

- Don't assume that every contract that claims to implement a standard has implemented it _correctly_. (Slightly less relevant for protocols that implement asset standards at the protocol level, like [Algorand](https://developer.algorand.org/docs/get-details/asa/).)
- Don't assume that just because a contract works properly now that it will work properly in the future.
  - A contract may get hacked.
  - If the contract is [proxied](https://blog.openzeppelin.com/proxy-patterns/) or [upgradable in-place](https://docs.near.org/develop/upgrade#programmatic-update), the logic may change without the address changing.

### Make invalid states unrepresentable

This will be somewhat platform-dependent, as different smart contract programming languages have differing degrees of type system flexibility in this regard. Usually, any functional (or at least FP-inspired) programming language will have a sufficiently advanced type system. At least, look for support for full algebraic types (product _and_ sum).

Creating a good set of types for any system can be difficult, but it can also serve to reclassify a whole set of errors from runtime (or worse&mdash;undetected) to compile-time.

There's a great deal of prior writing on this topic, and as diving much deeper would entail specific examples, I will instead suggest the following resources:

- [Make invalid states unrepresentable: the untaught revelation](https://www.youtube.com/watch?v=3WE5L0OnqIU) (a video I made on the topic) or [the accompanying post on this site]({{< ref "blog/make-invalid-states-unrepresentable" >}}).
- [Designing with types: Making illegal states unrepresentable (Scott Wlaschin)](https://fsharpforfunandprofit.com/posts/designing-with-types-making-illegal-states-unrepresentable/)
- [Building a space station in Rust (Simple Rust patterns) [RUST-8] (No Boilerplate)](https://www.youtube.com/watch?v=7GzQArrek7A)
- [Why type-first development matters (Tomas Petricek)](https://tomasp.net/blog/type-first-development.aspx/)

### The pull model

Most smart contracts eventually have to disburse assets to their users, be it native tokens, contract tokens (e.g. ERC-20s), NFTs, etc. The pull model merely says that instead of pushing (sending) those assets out immediately, the contract will wait for them to be requested. This has a number of benefits:

- The assets remain in control of an account that is known to be valid. If (in the case of a protocol that supports account deletion, like NEAR Protocol) the account to which the assets were to be disbursed is no longer active, the assets will remain in the control of an entity that can still manipulate them (the smart contract). This is more important if the thing being transferred is something like "ownership of this contract," in which case accidentally transferring to an invalid account essentially bricks the contract.
- It saves on gas fees. If a rewards disbursal were initiated by a contract owner, and the disbursement is to, say 100k users, that could be a very expensive operation for the one contract owner (especially on high-fee networks like Ethereum), compounded with the fact that maybe not every user may actually use the rewards. Instead, the pull model offloads the gas fees to the user receiving the disbursal.
- It allows for easier monitoring of user activity. If all disbursals are mediated by a single `withdraw` function (or something similar), it makes it easier to apply limits and detect possible suspicious behavior. If you know that only one function can disburse funds, it makes it easier to secure the disbursal of funds.

### Know your workflow

Know your workflow, and don't allow it to be abused. This means:

- Knowing, documenting, and testing the happy path. Often this means setting up a CI service to run tests on every commit. (GitHub Actions is great at this for open-source projects.)
- Ensuring that every deviation from the happy path is either impossible to reach or dealt with in such a way that it does not leave the contract in an invalid state. (For example, implementing the [checks-effects-interactions pattern](https://docs.soliditylang.org/en/v0.8.17/security-considerations.html#use-the-checks-effects-interactions-pattern) in Solidity to avoid reentrancy vulnerabilities.) \
   Deviations from the happy path should be well-tested too (i.e. check for failure).

### Understand the limitations and quirks of your platform

Ideally, this means diving deep into the architecture of your specific smart contract execution environment. EVM? Study memory layout, proxy calls, bytecode, and the ABI. WASM? Study I/O, type representation (JSON limitations?), environment injection, and gas calculation.

### Get audited

At this point in time, there is no excuse for a contract that expects to be seeing a decent amount of volume to not publish regular audits.

Solidity contracts absolutely. There are quite a few respectable auditing firms with Solidity experience. Other protocols may still be in their infancy in this regard, but that won't stop hackers&mdash;it should be just as high of a priority for a protocol to onboard competent developers as competent auditors.

### Miscellaneous

- Don't hardcode gas values. [Protocols can and will change them](https://eips.ethereum.org/EIPS/eip-150).
- Be aware of function access modifiers.
- Be wary of any sort of looping or iterating operation. (First, make sure you couldn't remove the loop entirely by using something like [the pull model](#the-pull-model).) If it is possible that the collection over which you are iterating could grow to a point where the gas would become prohibitively expensive, consider condensing the data (would a Merkle tree suffice?) or paginating/limiting it.
- Don't store private data on-chain. Blockchains are public.[^public]

[^public]: Except for a small, but growing number, e.g. [Monero](https://www.getmonero.org/), [ZCash](https://z.cash/), [Mina](https://minaprotocol.com/).

---

This is a lot, and one of the longer blogs I've written, but with good reason: security is ever-increasing in its importance in this industry, and it's all-too-often ignored. I've barely scratched the surface here, but I hope it was a good jumping-off point.

Don't be the next multi-billion dollar victim.

{{% bio %}}
