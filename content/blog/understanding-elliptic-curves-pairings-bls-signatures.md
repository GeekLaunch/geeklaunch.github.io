---
title: "Path to understanding: elliptic curves, pairings, and BLS signatures"
date: 2024-03-07
lastmod: 2024-03-10
description: "The notoriously slippery mathematics behind modern cryptography."
author: Jacob Lindahl
twitter: sudo_build
math: true
license:
  name: CC BY-SA 4.0
  link: https://creativecommons.org/licenses/by-sa/4.0/
---

One of the most fun things about working with blockchain technology is the opportunity to tinker around with cutting-edge cryptography technology. Recently, I was fortunate enough to have the opportunity to learn about BLS (Boneh, Lynn, Shacham) signatures.[^bls] This post serves as a checkpoint in my understanding of the scheme and the concepts that undergird it, as well as a guide for others.

[^bls]: Boneh, D., Lynn, B. & Shacham, H. Short Signatures from the Weil Pairing. _J Cryptology_ **17**, 297&ndash;319 (2004). <https://doi.org/10.1007/s00145-004-0314-9>.

I am not a professional mathematician, so I will not be explaining these topics rigorously or completely. Rather, the goal is to articulate the mental model for working with these primitives for posterity and public edification. Almost as importantly, this article is _short_, digestible (hopefully), and provides a lot of references for digging deeper.

This article is a light introduction to the concepts necessary to understand [Vitalik Buterin's article about cryptographic pairings](https://medium.com/@VitalikButerin/exploring-elliptic-curve-pairings-c73c1864e627).

## Groups & finite fields

Most cryptosystems deal with groups in some form. A group basically consists of a set of elements, and an operator that combines two group elements to produce another group element.

For example, the set $\\{0, 1, 2, 3, 4\\}$ with operation $+ \pmod{5}$ is a group.

The set $\\{\text{all rotation \\& reflection symmetries of a regular polygon}\\}$ with operation $\circ$ (composition) [is a group](https://en.wikipedia.org/wiki/Dihedral_group).

Selected topics that are critical to understanding BLS signatures include:

- A generator. This is a group element which, when the group operation is repeatedly applied to it, produces every other group element.
- [Abelian groups](https://brilliant.org/wiki/abelian-group/) (the group operation is commutative).

The concept of a group is not only useful for understanding BLS signatures: this mathematical structure is used in many cryptographic schemes, including RSA & ECDSA signature schemes, as well as zero-knowledge proofs.

Groups of integers with mathematical operations like addition or multiplication are called [finite fields](https://en.wikipedia.org/wiki/Finite_field). When referring to a group with a specific operation, we say "additive group" or "multiplicative group."

## The discrete logarithm problem

So, we have a group and an operator. Let's say, for example, our group is the set $\\{0, 1, 2, 3, 4, 5, 6, 7, 8\\}$ and the operation is multiplication $\times \pmod{9}$.

Repeatedly performing the multiplication operation on an element with itself is called _exponentiation_. The notation for repeatedly multiplying element $x$ with itself $y$ times is $x^y$. For example:

$$
\begin{align*}
2^1 &= 2 &= 2 \pmod{9} \\\\
2^2 &= 2 \times 2 &= 4 \pmod{9} \\\\
2^3 &= 2 \times 2 \times 2 &= 8 \pmod{9} \\\\
2^4 &= 2 \times 2 \times 2 \times 2 &= 7 \pmod{9} \\\\
2^5 &= 2 \times 2 \times 2 \times 2 \times 2 &= 5 \pmod{9} \\\\
\end{align*}
$$

As it turns out, this operation is fairly straightforward to understand and implement. However, the same is not true for the inverse: the logarithm.

As a quick refresher, a logarithm is like the opposite of exponentiation. Whereas the exponential expression $x^y$ tells us the value of multiplying $x$ with itself $y$ times, the logarithm, denoted $\log_x{y}$, tells us how many times we need to multiply $x$ with itself to get $y$. That is to say, $x^{\log_x{y}} = y$ for $x > 1, y > 0$.

In normal, non-finite-field mathematics, the logarithm is comparatively easy to calculate, but for finite fields, it is more challenging,[^np] and so much so that its difficulty is the basis for the security of many cryptosystems.

[^np]: Specifically, it cannot be computed in [polynomial time](<https://en.wikipedia.org/wiki/P_(complexity)>), [as far as we know](https://cs.stackexchange.com/a/2765).

## Elliptic curves as groups

Groups don't have to be rings of integers; they can also be points along a curve. In particular, the points along an [elliptic curve](https://mathworld.wolfram.com/EllipticCurve.html) can be used to form groups that are quite useful in cryptography.[^ecc]

[^ecc]: Elliptic curve cryptography (ECC).

An elliptic curve [looks like](https://samuelj.li/elliptic-curve-explorer/) $y^2 = x^3 + ax + b$ for constants $a$ and $b$.[^secp-ex] We use points on the curve, along with a special point called "the point at infinity"[^point-at-infinity] to form the membership set.

[^secp-ex]: For example, the curve used by [secp256k1](https://en.bitcoin.it/wiki/Secp256k1) is $y^2 = x^3 + 7$.
[^point-at-infinity]: I'm not going to cover exactly what this is in this post. However, if you're interested to learn more about it, [this article on projective geometry from Brilliant.org](https://brilliant.org/wiki/projective-geometry/) is a great place to start.

Now that we have our group members, we need an operation to combine them. Elliptic curve points can be combined using a process called "elliptic curve pointwise addition."

Recall that the equation for an elliptic curve is a cubic curve (polynomial order 3), so a line (order 1) will intersect it at $3 \times 1 = 3$ points.[^columbia-ums] We use this fact to define the addition of two points along the curve.

Let the two points we wish to add be $\mathcal{P}$ and $\mathcal{Q}$. We draw a line from $\mathcal{P}$ to $\mathcal{Q}$, and $\mathcal{R}$ is the third point that the line intersects. We set up the equation $\mathcal{P} + \mathcal{Q} + \mathcal{R} = \mathcal{O}$, where $\mathcal{O}$ is the point at infinity (and also happens to be the additive identity &ne; the origin). Solving for $\mathcal{P} + \mathcal{Q}$ gives us $\mathcal{P} + \mathcal{Q} = -\mathcal{R}$. "Negating" a point on the curve means flipping it across the x-axis.[^negation-illustration]

[^negation-illustration]: [Here is an illustration](https://www.researchgate.net/figure/The-group-law-for-an-elliptic-curve-P-Q-R-The-points-P-and-Q-sum-to-the-point-R_fig1_23552588) of what this operation looks like in the affine plane.

[^columbia-ums]: Block, Adam. "Introduction to Elliptic Curves." Columbia Undergraduate Math Society, 2017. <https://www.math.columbia.edu/~ums/pdf/UMS%20Talk%203.pdf>.

This operation is called elliptic curve pointwise addition, and it is the group operation (also called the "group law") for elliptic curves.

When repeatedly _adding_ an elliptic curve point to itself, there is a problem analogous to the discrete logarithm problem in finite fields, called the "elliptic curve discrete logarithm problem."[^ecdlp] The difficulty of this problem similarly provides security for some cryptosystems.

[^ecdlp]: Blumenfeld, Aaron. "Discrete Logarithms on Elliptic Curves." _Rose-Hulman Undergraduate Mathematics Journal_ 12, no. 1 (January 15, 2017). <https://scholar.rose-hulman.edu/rhumj/vol12/iss1/3>.

## Pairings are bilinear maps

A bilinear map is a function $e: \mathbf{G}_1 \times \mathbf{G}_2 \rightarrow \mathbf{G}_T$[^typenot] that satisfies the following constraints:

[^typenot]: This notation indicates the type of the function. In this case, it means: the function $e$ takes two arguments, the first an element from group $\mathbf{G}_1$, and the second an element from group $\mathbf{G}_2$, and returns an element from group $\mathbf{G}_T$.

$$
\begin{align*}
X, X^\prime &\in \mathbf{G}_1 \\\\
Y, Y^\prime &\in \mathbf{G}_2 \\\\
a &\in \mathbb{Z}
\end{align*}
$$
[^howtoread-vars]

[^howtoread-vars]: This means: "The variables $X$ and $X^\prime$ are elements of group $\mathbf{G}_1$. The variables $Y$ and $Y^\prime$ are elements of group $\mathbf{G}_2$. The variable $a$ is any integer, including zero and negatives."

$$
\begin{align}
e(X + X^\prime,Y) &= e(X,Y) \times e(X^\prime,Y) \\\\
e(X,Y + Y^\prime) &= e(X,Y) \times e(X,Y^\prime) \\\\
e(aX,Y) &= e(X,Y)^a \\\\
e(X,aY) &= e(X,Y)^a \\\\
e(X,Y)^a \ne 1 &\leftrightarrow a \ne 0
\end{align}
$$[^notation] [^degenerate]

[^notation]: Note that [some sources](https://ocw.mit.edu/courses/res-18-011-algebra-i-student-notes-fall-2021/mit18_701f21_lect24.pdf) may use a different set of operations: $+$ instead of $\times$, and $\times$ instead of $ \char`\^ $. This is merely a difference in notation. I have opted to use the notation that seems to be most common in existing practical cryptography materials pertaining to ECC pairings.

[^degenerate]: Line (5) is a "non-degeneracy" requirement. Without it, $e(x,y) = 1$ would be a valid pairing. Since it's a useless one, we exclude it and others like it.

Lines (3) and (4) are the most interesting for our purposes.[^derivable] Simply put, **we are allowed to freely swap scalar factors between the two parameters of $e$**.

[^derivable]: As it turns out, lines (3) and (4) can be derived from lines (1) and (2), but it is helpful to state them outright.

One common example of a simple bilinear map on the integers is the function $e(x,y)=2^{xy}$.

For the remainder of this post, $\mathbf{G}_1 = \mathbf{G}_2$, so we'll just call the input group $\mathbf{G}$. An elliptic curve pairing is a bilinear map where $\mathbf{G}$ is an elliptic curve.[^pairing-def] Two such pairings are the Weil pairing and the Tate pairing.[^specific-pairings]

[^pairing-def]: This statement is more of an introduction of terminology than a definition. It is _far_ from complete or rigorous.

[^specific-pairings]: Bethencourt, John. "Intro to Bilinear Maps." Computer Sciences Department, Carnegie Mellon University, n.d. <https://people.csail.mit.edu/alinush/6.857-spring-2015/papers/bilinear-maps.pdf>.

## BLS signatures

The BLS signature scheme uses elliptic curve pairings[^bls-weil] to describe a simple signature scheme.

[^bls-weil]: The BLS paper uses the Weil pairing.

A signature scheme is a means of proving that an actor is the originator (or creator, generator, approver, etc.) of a message. This involves the actor using a secret value (a "private key" or "secret key") to generate a "signature" to distribute with the message. The actor also distributes a "public key" (or "verification key") which others can use to verify that the signature was generated using the private key, which implies that the signature could only have been generated by the actor.

### Setup

Usually predetermined as part of the protocol design.

1. Choose elliptic curve $\mathbf{E}$ with generator $g$.
2. Choose pairing function $e: \mathbf{E} \times \mathbf{E} \rightarrow \mathbf{G}_T$.

### Key generation

Performed once by the actor who plans to generate signatures.

1. Choose a private key, scalar $\alpha$.
2. Calculate and distribute public key $p = \alpha g$.

### Signing

Performed every time the actor signs a message.

1. Choose message $m \in \mathbf{E}$.[^hashing]
2. Calculate and distribute signature $\sigma = \alpha m$.

[^hashing]: If your message is not already a point on the curve (it probably isn't) then you can use a hash function to convert it.

### Verification

Performed by anyone wishing to verify the signature for a message.

1. Check whether $e(p, m) = e(g, \sigma)$:

$$
\begin{align*}
e(p, m) &= e(g, \sigma) \\\\
&= e(g, \alpha m) \\\\
&= e(g, m)^\alpha \\\\
&= e(\alpha g, m) \\\\
&= e(p, m)
\end{align*}
$$

---

This scheme has a number of very nice properties, one of which is its efficiency: signatures are quick and easy to generate, and are small in size&mdash;just a single point on the elliptic curve. However, because elliptic curves pairings are still quite expensive to compute, _verifying_ signatures is quite slow compared to other signature schemes.

Aggregate signatures can be easily constructed by multiplying signatures together.[^bls-agg]

[^bls-agg]: Boneh, Dan, Manu Drijvers, and Gregory Neven. "Compact Multi-Signatures for Smaller Blockchains." In _Advances in Cryptology – ASIACRYPT 2018_, edited by Thomas Peyrin and Steven Galbraith, 435–64. Lecture Notes in Computer Science. Cham: Springer International Publishing, 2018. <https://doi.org/10.1007/978-3-030-03329-3_15>.

Threshold signatures (distribute $n$ keyshares, any $t < n$ of them can generate a valid signature) can also be constructed (slightly less simply than aggregate signatures).[^bls-thresh]

[^bls-thresh]: Tomescu, Alin, Robert Chen, Yiming Zheng, Ittai Abraham, Benny Pinkas, Guy Golan Gueta, and Srinivas Devadas. "Towards Scalable Threshold Cryptosystems." In _2020 IEEE Symposium on Security and Privacy (SP)_, 877–93. San Francisco, CA, USA: IEEE, 2020. <https://doi.org/10.1109/SP40000.2020.00059>.

---

## Additional resources

### Videos

- [Pairings in Cryptography (Dan Boneh)](https://www.youtube.com/watch?v=8WDOpzxpnTE)
- [BLS Signatures and Key Sharing with Crypto Pairs (Bill Buchanan)](https://www.youtube.com/watch?v=cVgJBdM5E2M)
- [Cryptography 101 for Blockchain Developers Part 3/3: Elliptic Curve Pairings (OpenZeppelin)](https://www.youtube.com/watch?v=9TFEBuANioo)

### Articles

- [Exploring Elliptic Curve Pairings (Vitalik Buterin)](https://medium.com/@VitalikButerin/exploring-elliptic-curve-pairings-c73c1864e627) ([archive.org](https://web.archive.org/web/20240226035801/https://medium.com/@VitalikButerin/exploring-elliptic-curve-pairings-c73c1864e627))
- [What Are Elliptic Curve Pairings? (Zellic)](https://www.zellic.io/blog/what-are-elliptic-curve-pairings/) ([archive.org](https://web.archive.org/web/20240207013708/https://www.zellic.io/blog/what-are-elliptic-curve-pairings/))

### Books

- [Pairings for beginners (Craig Costello)](https://static1.squarespace.com/static/5fdbb09f31d71c1227082339/t/5ff394720493bd28278889c6/1609798774687/PairingsForBeginners.pdf) ([archive.org](https://web.archive.org/web/20240119065123/https://static1.squarespace.com/static/5fdbb09f31d71c1227082339/t/5ff394720493bd28278889c6/1609798774687/PairingsForBeginners.pdf))[^thanks-porter]

[^thanks-porter]: Thanks to [Porter Adams](https://www.linkedin.com/feed/update/urn:li:activity:7171725082224963584?commentUrn=urn%3Ali%3Acomment%3A%28activity%3A7171725082224963584%2C7171754572875517952%29&dashCommentUrn=urn%3Ali%3Afsd_comment%3A%287171754572875517952%2Curn%3Ali%3Aactivity%3A7171725082224963584%29) for this suggestion!
