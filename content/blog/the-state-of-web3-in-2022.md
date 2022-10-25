---
title: 'The State of Web3 in 2022'
date: 2022-06-22
draft: false
description: 'There are a lot of issues that web3 needs to address, and fast.'
---

There are a lot of issues that web3 needs to address, and fast.

I recently attended CoinDesk Consensus 2022, and I talked to a _lot_ of people there. The goal of this document is to answer the most common questions and address the most common themes that arose from these conversations.

## Innovation transcends regulation

The crypto ecosystem flails around a lot, and even as someone who works within the industry, sometimes it's difficult to see where it's going as a whole: the web3 world quickly transitioned from its L1 launch and ICO heyday, to the NFT craze, to the liquidity farming frenzy. Arguably, we still haven't really seen the end of the "L1 launch heyday"; it's simply been eclipsed in popularity by the latest over-hyped trend.

Forget about trying to discern the direction of the ecosystem&mdash;some L1 projects have yet to figure out their value prop. Are they a dapp platform? Are they a store of value? App chain? Decentralized storage solution? What do they bring to the table that other projects don't? And is that actually* valuable*? Or is it merely the latest cool buzzword in protocol architecture?

Crypto often doesn't know what crypto wants.

How, then, could regulators _possibly_ hope to know more about an industry than the industry knows about itself? How can the ranger know where the fences and guardrails need to go to protect and guide along a treacherous trail when the hikers have yet to decide which mountain to climb in a nigh-infinite range?

No governing body will hold off on regulating an industry before it has found its place in the world. Politicians are voracious when they detect an opportunity for taxation and domineering.

So what can we, the web3 collective, do?

We can't stop.

The only way to avoid getting stifled by regulation is to innovate faster than the elite, political upper-class can legislate.

I'm not trying to make an overly political statement here. Well, not beyond this truism: politicians will regulate anything, even including&mdash;_especially_ including&mdash;[that which they don't understand](https://www.cnet.com/news/politics/some-senators-in-congress-capitol-hill-just-dont-get-facebook-and-mark-zuckerberg/). Therefore, some of the most impactful work being done for the future preservation of web3 is not in yield farming, derivatives markets, crypto credit cards, or NFTs, but in zero-knowledge, security, integrity, and critical infrastructure.

One of the foundations of crypto&mdash;consensus mechanisms&mdash;exists to prevent malicious actors from having their way with the future of the network. These are technologies that make crypto resilient to invasive regulation and malicious doings.

## Web3 leaves outsiders behind

Crypto is a bubble&mdash;but I don't mean [that kind of bubble](https://en.wikipedia.org/wiki/Cryptocurrency_bubble). (Keep in mind, I'm writing this in the middle of a bear market!)

Crypto is a clique.

At cryptocurrency conferences, like [CoinDesk Consensus 2022](https://www.coindesk.com/consensus2022/) I recently attended, I'll often get into conversations that are terribly niche and not particularly beginner-friendly: discussing things like the implications of the functional programming paradigm on smart contract security, or how NEAR Protocol parallelizes transaction processing across shards using receipts, or how to repurpose an [ERC-712](https://eips.ethereum.org/EIPS/eip-712) payload as a seed for a cross-chain signature. Not to discount the value of such discussions&mdash;they're useful and necessary&mdash;but everyone who wants web3 to succeed should pay very close attention to what they say.

(A secondary complaint on cryptocurrency conferences in general: how do we expect the common developer to get connected with the web3 community if access to these conferences requires: business connections, enrollment in an institution of higher learning, or a pocketbook that can float a $2,000 ticket? But that's a bit of a rabbit trail.)

The path to success does not lie in "stealing" developers from other web3 projects. Our attitude should be one of camaraderie, not offensive competition. This is a nascent sector of technology: a win for most any project should be considered a win for all of us. I don't celebrate when second-rate projects encounter obstacles or fail (unless the project really was a straight-up scam, but even that still reflects negatively on web3).

Directing networking efforts towards sectors that are eminently web3-familiar merely serves to calcify the barrier between web3 and the rest of tech. With this in mind, I think projects should focus their efforts primarily on recruiting web2 (or at least non-web3) developers.

We must ensure we're not making it harder for ourselves. I'd venture to guess that most developers outside of the crypto space don't regularly contemplate issues of consensus, zero-knowledge, or trustlessness. I'm not saying we should abandon these topics; we should make sure that we don't develop a holier-than-thou, cliquey attitude towards the heretofore "unenlightened." We need to get our heads out of the clouds and away from the jargon and ground ourselves. Web3 can still be a part of the larger software development community, but we won't win widespread support via [indiscriminate use of doublespeak](https://web.archive.org/web/20220614162428/https://www.cusd80.com/cms/lib/AZ01001175/Centricity/Domain/318/The%20World%20of%20Doublespeak-William%20Lutz.pdf).

Web3 is an obviously Internet-y community, and as any participant in an Internet-based community can tell you, [cultivating a welcoming, beginner-friendly attitude is hard](https://stackoverflow.com/).

Let's be the exception.

## We don't need another smart contract DSL

This is pretty simple: every single L1 doesn't need its own custom programming language. It is not reasonable for a dapp platform to maintain an entire language (including its ecosystem: IDE support, documentation, build tools, community, security&hellip;) on top of an entire Internet protocol (which requires an entire ecosystem of its own).

I am a graduate student studying programming languages, and after examining the language design of a few different smart contract DSLs, I can say with a reasonable degree of confidence that language design is best left to the language designers.

Many programming languages have virtual machines that are lightweight and (relatively) easy to work with. WebAssembly is the obvious front-runner in web3 today, but there are lightweight or easily-embedded implementations of many other general-purpose programming languages as well (like Lua, ECMAScript, Ruby, Lisps, and heck, you could probably find a way with Haskell or Ocaml too).

There is no need to implement yet another language for your new L1.

## WebAssembly may be the future

Despite the name *Web*Assembly, [WASM is useful in many more contexts than simply front-end web](https://webassembly.org/docs/non-web/), and may be the future in applications, mobile, front-end, server, and blockchain.

Spinning up a WASM VM is relatively cheap: faster performance for serverless functions.

WASM is pretty simple: great for embedded applications and blockchain.

WASM has good cross-platform support: applications can reuse common WASM components across platforms.

The WebAssembly ecosystem is growing rapidly. My advice: look into it sooner rather than later. (This probably means you should [learn Rust](https://doc.rust-lang.org/stable/book/). Rust is my favorite programming language. Okay. I'm biased.)

## A "blockchain" project is not a better project

This feels like a tired old slogan, but it still bears repeating.

Lots of crypto projects struggle to find a foothold outside the existing web3 community; they fail to attract new, non-web3 users into the space. For example, I don't know of anyone who started using web3 because they wanted to use a dex to swap Tezos for Solana.

I like this example because it demonstrates that even one of the greatest offerings of web3&mdash;trustless, P2P exchange&mdash;hasn't been enough to enrapture the world. However, it also doesn't completely encompass the point I'm trying to make.

I'm going to pick on the crypto games and NFTs. Easy targets, I know. But they get a lot of press, and a lot of hate, often for good reason. Crypto games are too often thinly-veiled pay-to-win cash grabs that leave a bad taste in your mouth, or they're dolled-up RNG "investment" opportunities, or they're games that decided to add "blockchain technology" to their tech stack because they didn't pay their writers enough to compose an engaging story, or they're the latest attempt to rationalize DLC.

There's a lot of hype in crypto space. It's tempting to take advantage of the hype to make a quick buck, and I can't stop you. If you want to be a slimy Internet scammer, be my guest. (That's why a significant part of my job is teaching people about web3, allowing them to discern dirty scammers from honest, forward-thinking businesses.)

But to those with integrity, understand that blockchain technology is not the silver bullet that will thrust your startup to success. Blockchain actually has an extremely limited use-case, one which for _the vast majority of businesses_ is better accomplished by a regular old (centralized) database. Do your customers the favor of choosing the best infrastructure for them, and not the fun, weird tech that will end up costing you in the future.

## Web3 is revolutionizing Internet infrastructure

Dapps built on blockchain technology have taken the world by storm, but the protocol layer is affecting the network stack downwards as well as upwards.

I encountered two interesting projects for the first time over the past week. (Not an endorsement. I have no financial interest in these projects and merely present them as an illustration of this point.)

1. [Syntropy](https://www.syntropynet.com/) uses a decentralized system to incentivize ISPs to reroute network packets more efficiently, like an alternative to[ BGP](https://en.wikipedia.org/wiki/Border_Gateway_Protocol).
1. [Data Vortex](https://www.datavortex.com/) is developing switch architecture that routes packets more efficiently, as well as a custom protocol that replaces Ethernet for blazing-fast transfers.

## Does [insert protocol here] have a chance to take over as the de-facto dapp platform?

Not really.

{{% bio %}}
