---
title: "Releasing v1.0.0"
date: 2023-12-30
description: "When should small projects release their first major version?"
author: Jacob Lindahl
twitter: sudo_build
license:
  name: CC BY-SA 4.0
  link: https://creativecommons.org/licenses/by-sa/4.0/
---

`1.0.0`

What does this number actually mean? Of course, [semantic versioning (SemVer)](https://semver.org/) says this means "major version 1, minor version 0, patch 0," but there seems to be a certain significance, a psychological _weight_ to releasing major version 1.

Many projects never make it to version 1, languishing in the trench of eternal `0.*`. The release cycle has long since stabilized, and the project has been a production-ready&mdash;even LTS&mdash;state for many years.

I'm not here to tell you that you're managing your project wrong. If you have a process that works for you and your users, heck, if you simply have a process that you like, then don't worry about it.

SemVer is a standard that many ecosystems have adopted. The Rust ecosystem has it baked into the package manager. Projects that never make it to major version 1 despite being stable, production-ready, etc. are missing out on some of the value that the versioning standard can provide. They are more difficult to use, because every minor version (0._**X**_.0) upgrade must be treated as breaking. Failing to release version 1 while the project is an active part of the ecosystem is failing to follow the versioning standard.

Let's review: `major.minor.patch`. First off, obviously, if the major version is locked to 0, version numbers will be missing a significant amount of granularity. Further, the SemVer spec itself says that "Major version zero (0.y.z) is for _initial development_"[^semver-zero] (emphasis added).

[^semver-zero]: <https://semver.org/#spec-item-4>

What concerns might be at play here?

**Perspective 1**: "Releasing version 1.0.0 is a commitment to the project being 'complete,' in some sense. Therefore, as long as the project isn't done[^done], it would be dishonest (i.e. exaggerating/overpromising to users) to announce the release of 1.0.0." \
**Perspective 2**: "Because the major version number has to change to indicate backwards-incompatible changes, if the project API isn't stable yet, releasing version 1.0.0 too early would lead to a weirdly high major version number by the time the API _is_ stable."

[^done]: Feature-complete, 100% test coverage, industry adoption, passed security audit&hellip; "done" could mean a lot of different things.

With that in mind, when should a project finally release that "milestone" 1.0.0?

It seems to me that the longer 1.0.0 is delayed, the less likely it is to be released at all. Therefore, I am going to recommend that 1.0.0 be released sooner rather than later. Especially for small projects&mdash;they can usually reach MVP within a few months. That should be version 1.0.0.

Version 1.0.0 does not mean "this project is done." It does not mean that the project does not have bugs. It does not mean that the project is feature-complete, supporting every platform and integration planned. It simply means that the API is stable _enough_ to use.

Finally, to relieve some of the pressure: the SemVer standard does not enjoin a duration of support or maintenance on major versions. You don't have to be married to major version number. If you want to release a new major version and be done with the old major version, go for it. Release those breaking changes.[^disruption]

[^disruption]: Of course, if it would disrupt the ecosystem around the project, maybe don't. But if that is the case, you should have released version 1.0.0 already.

Don't fear version 1.

It really is just a number.

---

Thanks to [Don Dall](https://github.com/dndll/) for his advice in constructing this rant.

{{% bio %}}
