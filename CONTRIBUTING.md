# Contributing to Immich

We appreciate every contribution, and we're happy about every new contributor. So please feel invited to help make Immich a better product!

## Getting started

To get you started quickly we have detailed guides for the dev setup on our [website](https://docs.immich.app/developer/setup). If you prefer, you can also use [Devcontainers](https://docs.immich.app/developer/devcontainers).
There are also additional resources about Immich's architecture, database migrations, the use of OpenAPI, and more in our [developer documentation](https://docs.immich.app/developer/architecture).

## General

Please try to keep pull requests as focused as possible. A PR should do exactly one thing and not bleed into other, unrelated areas. The smaller a PR, the fewer changes are likely needed, and the quicker it will likely be merged. For larger/more impactful PRs, please reach out to us first to discuss your plans. The best way to do this is through our [Discord](https://discord.immich.app). We have a dedicated `#contributing` channel there. Additionally, please fill out the entire template when opening a PR.

## Finding work

If you are looking for something to work on, there are discussions and issues with a `good-first-issue` label on them. These are always a good starting point. If none of them sound interesting or fit your skill set, feel free to reach out on our Discord. We're happy to help you find something to work on!

We usually do not assign issues to new contributors, since it happens often that a PR is never even opened. Again, reach out on Discord if you fear putting a lot of time into fixing an issue, but ending up with a duplicate PR.

## Use of Generative AI

We **actively encourage** the use of LLMs and AI coding tools. Unlike some projects that ban AI-generated code, we believe these tools are a massive force multiplier when used correctly. The key ingredient isn't avoiding AI — it's having a clear spec.

**All PRs must include a spec or design document** that describes *what* the change does and *why*. This applies whether you wrote every line by hand, pair-programmed with an LLM, or let an agent do the heavy lifting. A well-written spec means reviewers can evaluate intent and correctness, not just syntax — and it turns out that's what matters regardless of who (or what) wrote the code.

**All PRs must also include tests.** We didn't get from 74% to 94% server test coverage by accident. Tests are how you prove your code works — spec says *what*, tests prove *that*. No tests, no merge.

In our experience, the "large amount of back-and-forth" that some projects attribute to LLM-generated code is really a symptom of missing specs and unclear requirements. Solve that, add tests, and the tooling becomes irrelevant.

## Feature freezes

From time to time, we put a feature freeze on parts of the codebase. For us, this means we won't accept most PRs that make changes in that area. Exempted from this are simple bug fixes that require only minor changes. We will close feature PRs that target a feature-frozen area, even if that feature is highly requested and you put a lot of work into it. Please keep that in mind, and if you're ever uncertain if a PR would be accepted, reach out to us first (e.g., in the aforementioned `#contributing` channel). We hate to throw away work. Currently, we have feature freezes on:

- Sharing/Asset ownership
- (External) libraries

## Non-code contributions

If you want to contribute to Immich but you don't feel comfortable programming in our tech stack, there are other ways you can help the team.

### Translations

All our translations are done through [Weblate](https://hosted.weblate.org/projects/immich). These rely entirely on the community; if you speak a language that isn't fully translated yet, submitting translations there is greatly appreciated!

### Datasets

Help us improve our [Immich Datasets](https://datasets.immich.app) by submitting photos and videos taken from a variety of devices, including smartphones, DSLRs, and action cameras, as well as photos with unique features, such as panoramas, burst photos, and photo spheres. These datasets will be publically available for anyone to use, do not submit private/sensitive photos.

### Community support

If you like helping others, answering Q&A discussions here on GitHub and replying to people on our Discord is also always appreciated.
