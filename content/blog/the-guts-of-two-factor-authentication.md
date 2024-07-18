---
title: "The guts of 2FA: RFC-4226 and RFC-6238"
date: 2024-04-27
# lastmod: 2024-04-27
description: "Where do those evanescent six-digit codes come from?"
author: Jacob Lindahl
twitter: sudo_build
math: true
license:
  name: CC BY-SA 4.0
  link: https://creativecommons.org/licenses/by-sa/4.0/
---

Proving your identity to an Internet service can be a bit involved these days. As the methods used by hackers have grown more sophisticated, authenticating oneself to an application has become more complicated. All but the most trivial of services nowadays will employ such practices as: emailing you when logging in from a new device, texting you a secret code via SMS, requiring you to approve the login request via an app, etc.

To the average user, most of these methods probably seem fairly straightforward. However, the concept of one-time passwords (OTPs) is a little more creative.

OTPs are a form of two-factor authentication (2FA) which allow services to confirm that the client attempting to prove its identity:

1. Knows some secret information (e.g. a password).
2. Has access to some physical device (e.g. a smartphone).

The physical device knows some secret information, but instead of divulging it during every authentication attempt, merely proves knowledge of it through some scheme. This is in contrast to a password, which is sent to the server in full during every authentication attempt.

The most common OTP generation scheme is described in two RFCs: [RFC-4226](https://datatracker.ietf.org/doc/html/rfc4226) and [RFC-6238](https://datatracker.ietf.org/doc/html/rfc6238).

| RFC-4226 (December 2005)[^rfc4226]                | RFC-6238 (May 2011)[^rfc6238]                        |
| ------------------------------------------------- | ---------------------------------------------------- |
| HMAC-based OTPs (HOTP)                            | Time-based OTPs (TOTP)                               |
| Two-factor authentication using a shared counter. | HOTP with a counter derived from the UNIX timestamp. |

[^rfc4226]: M'Raihi, David, David M'Raihi, Frank Hoornaert, David Naccache, Mihir Bellare, and Ohad Ranen. "HOTP: An HMAC-Based One-Time Password Algorithm." Request for Comments. Internet Engineering Task Force, December 2005. <https://doi.org/10.17487/RFC4226>.
[^rfc6238]: M'Raihi, David, Johan Rydell, Mingliang Pei, and Salah Machani. "TOTP: Time-Based One-Time Password Algorithm." Request for Comments. Internet Engineering Task Force, May 2011. <https://doi.org/10.17487/RFC6238>.

## RFC-4226: HMAC-based OTPs

The first RFC describes a system for two-factor authentication that relies on the two parties (i.e. the client and the server) sharing a secret and a synchronized counter. During the initialization of the protocol, the parties exchange and save the secret. In following authorization attempts, both parties derive the "next" OTP from their shared secrets and counters. If the OTP submitted by the client matches what the server calculated, then the server can be confident that the client actually does know the secret, and both parties increment their counters.

The HOTP is calculated as follows:

1. Initialize the HMAC[^what-is-hmac] with a secret key obtained from the server.
2. Hash the shared counter using the HMAC from the previous step.
3. Perform **dynamic truncation** on the hash, resulting in 31 bits.[^why-31]
4. Return those bits $\mod{10^n}$ (big endian[^big-endian]), where $n$ is the desired number of digits in the OTP ($6 \le n \le 10$).

[^what-is-hmac]: HMAC, **H**ash-based **M**essage **A**uthentication **C**odes, use a hash algorithm keyed with a secret key to produce a message authentication code that proves that the message has not been tampered with. In a way, the HMAC is to symmetric cryptography what the signature is to asymmetric cryptography. Please see [this simple explanation](https://www.okta.com/identity-101/hmac/) or [the RFC](https://datatracker.ietf.org/doc/html/rfc2104) for more information.
[^why-31]: The RFC specifies a 31-bit value to avoid possible confusion related to sign bits.
[^big-endian]: Big-endian and little-endian ("endianness") refer to byte order. Since we are dealing with more than one byte here, it matters which bytes we treat as more significant. Cryptography-related protocols usually use big-endian byte ordering (most significant bytes first), as is the case here.

Note that because $2^{31} < 10^{10}$, the 10th digit can only be `0`, `1`, or `2`.

This is a fairly straightforward protocol, with the exception of the dynamic truncation procedure, which is described next.

### Dynamic truncation

The default HMAC for this system, HMAC-SHA-1[^hmac-sha-1], produces a hash 160 bits (20 bytes) long. This is, of course, much more information than a six-digit OTP can represent. The dynamic truncation scheme is designed to extract a certain slice of those bits which can easily be converted into a short decimal string:

[^hmac-sha-1]: Although SHA-1 is no longer considered sufficiently secure to be recommended for the general use-case, [it is still used in this context](https://crypto.stackexchange.com/q/26510).

1. Select the <mark style="background-color: rgba(195, 37, 77, 0.35)"><strong>last four bits</strong></mark> of the bytestring.
2. Using those bits as an integer index, select <mark style="background-color: rgba(37, 195, 77, 0.35)"><strong>four bytes</strong></mark> (32 bits) from the bytestring.
3. Delete the first bit. (32 bits &rarr; 31 bits)

This procedure requires the input bytestring to be at least $15 + 4 = 19$ bytes long, though that risks reusing the last byte as both the index and part of the output.

For example:

<pre>
Hash:   2aae6c35c94fcfb415dbe95f40<mark style="background-color: rgba(37, 195, 77, 0.35)"><strong>8b9ce91e</strong></mark>e846e<mark style="background-color: rgba(195, 37, 77, 0.35)"><strong>d</strong></mark>
        ^^      ^^      ^^      ^^      ^^
Index:  0       4       8       12      16
</pre>

1. The last four bits are the hex digit <mark style="background-color: rgba(195, 37, 77, 0.35)"><strong>`d`</strong></mark> &rarr; 13.
2. Select four bytes starting from byte index 13 &rarr; <mark style="background-color: rgba(37, 195, 77, 0.35)"><strong>`8b9ce91e`</strong></mark>.
3. Delete the first bit (set it to zero) &rarr; `0b9ce91e`.

Thus, for this particular example hash, the dynamic truncation yields `0b9ce91e`.

### Counter resynchronization

Because clients and servers are not always able to maintain perfect communication with each other, there is a high chance that at some point, the client's counter and the server's counter may get out of sync. Because of this possibility, the RFC also describes a sort of "look-ahead" procedure, wherein a server does not immediately reject a client that submits a mismatched OTP, but instead probationally tests it against OTPs derived from adjacent counter values as well. The number of adjacent OTPs that the server will examine before issuing a rejection is called the "look-ahead window."

### The problem with pure HOTP

One of the biggest issues with an application implementing _only_ RFC-4226 is that if the desynchronization of the counter of one party exceeds the look-ahead window, the protocol ceases to function. The counter is an extra "moving part," per se, that adds complexity&mdash;state&mdash;to the protocol.

This is addressed in RFC-6238.

## RFC-6238: Time-based OTPs

Synchronizing an arbitrary counter is problem where its practical difficulty exceeds its immediately-apparent complexity. While it is a well-studied problem in contemporary computer science, it can be largely side-stepped in this case, since computers already synchronize counters with each other in their clocks.

RFC-6238 introduces time-based OTPs (TOTPs). TOTPs are HOTPs which, instead of using an arbitrary shared counter, use the UNIX timestamp in seconds $\mod{30}$. Since this counter contains no secret information[^secret-counter], it does not matter whether the counter value is private, as long as it is synchronized between the two parties.

[^secret-counter]: Note that this is not exactly true for basic HOTP, where the counter may approximately match the number of times the client has authenticated with the server, or will at least update whenever a client authenticates. If that counter were public, it could leak metadata about the client's usage of the system.

This means that as long as the client and the server have their clocks synchronized to within a few minutes of each other, they will be able to produce the same TOTP (within a look-ahead/behind window), and the client will be able to authenticate with the server.

## Sample implementation

A simple example implementation of HOTP and TOTP in Rust can be found [here](https://github.com/GeekLaunch/totp/blob/main/src/lib.rs).
