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

**All PRs must include a spec or design document** that describes _what_ the change does and _why_. This applies whether you wrote every line by hand, pair-programmed with an LLM, or let an agent do the heavy lifting. A well-written spec means reviewers can evaluate intent and correctness, not just syntax — and it turns out that's what matters regardless of who (or what) wrote the code.

**All PRs must also include tests.** We didn't get from 74% to 94% server test coverage by accident. Tests are how you prove your code works — spec says _what_, tests prove _that_. No tests, no merge.

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

## Releases

> Fork-maintainer reference. Gallery releases are separate from upstream Immich releases.

Gallery uses a **two-phase release flow** so mobile app builds are already live on Play Store and App Store before server users see a new version. All workflows are **manually triggered** via `workflow_dispatch` and appear in the Actions tab as:

- **Release Mobile P1** — phase 1 (start of a full release)
- **Release Gallery P2** — phase 2 (after mobile is live on stores)
- **Release Gallery Server-only** — skip mobile entirely (use for server-only hotfixes)

### Release Mobile P1 (`.github/workflows/gallery-release-mobile.yml`)

1. Maintainer triggers the workflow from the Actions tab. Version is computed automatically from commits since the last tag (rules below), or passed explicitly via input.
2. The mobile app is built and signed. Android AAB uploads to the Play Store internal track, iOS IPA uploads to TestFlight, the AAB is attached as a workflow artifact, and the APK is attached to the draft release for sideload.
3. A **draft** GitHub Release is created pinning the version (tag name), commit SHA (`target_commitish`), and APK (asset). The draft is invisible to end users.
4. The maintainer manually promotes the Play internal build to **production** in Play Console and submits the App Store build for review. Once both stores show the new version live to end users, proceed to phase 2. Typically ~24h.

To test the Play Store upload without creating a release draft or uploading to TestFlight, manually run `Gallery Build Mobile` with `environment=production`, a throwaway `version`, and `build_target=android`. This uploads a real Play internal-track build and consumes that Android `versionCode`, but does not publish server images or create a draft release.

### Release Gallery P2 (`.github/workflows/gallery-release.yml`)

1. Maintainer triggers the workflow from the Actions tab. No inputs.
2. The workflow discovers the pending draft from phase 1, reads the pinned version + SHA, and checks out at that exact SHA — so the server image matches the commit the mobile app was built from.
3. `gallery-server` and `gallery-ml` images build (amd64 + arm64 matrix) and push to GHCR tagged with the version, the major version (`v4`), and `release`.
4. Git tags are created: `vX.Y.Z` at the pinned SHA, and the floating `vN` + `release` tags move forward.
5. The draft release is promoted to published (`--latest`). The APK attached in phase 1 becomes the public sideload download.
6. `version.json` is uploaded to the S3 version endpoint — self-hosted instances polling this endpoint now show "new version available".

### Release Gallery Server-only (`.github/workflows/gallery-release-server-only.yml`)

Use for server / web / docs changes that don't affect the mobile app — ship without the ~24h mobile review wait. This is the right path for hotfixes and any change that doesn't ship new mobile binaries.

1. Maintainer triggers the workflow from the Actions tab. Version auto-bumps from commits, or passed explicitly.
2. Fails fast if a pending P1 mobile draft exists (version-number collision risk). Finish the mobile release first, or discard the draft.
3. Builds and pushes server + ML images at `main` HEAD, tags the release, creates a public GitHub Release, flips the version endpoint.
4. **No APK attached.** Release notes link to the previous release's APK for sideload users. Mobile users stay on the previous version.

**Do NOT use server-only for major version bumps** or any change that breaks the mobile app's API contract — ship those through the normal P1 → P2 flow so mobile catches up.

### Version selection (Release Mobile P1 and Release Gallery Server-only)

- `changelog:skip` PR label → commit is excluded from the bump computation
- `feat:` commit or `changelog:feat` PR label → **minor** bump (e.g. `v4.2.6` → `v4.3.0`)
- `BREAKING CHANGE` in commit body or `!` in commit prefix (e.g. `feat!:`) → **major** bump
- Everything else (`fix:`, `docs:`, `chore:`, etc.) → **patch** bump

If every commit since the last tag is `changelog:skip`, the workflow errors — there is nothing to release.

### Design properties

- Phase 2 builds from the draft's pinned SHA, not from `main`'s HEAD. Commits landing on main between the two phases are excluded from this release and ship in the next cycle.
- Manual edits to the draft's release notes during the waiting period are preserved — phase 2 promotes without regenerating notes.
- All three workflows fail fast if triggered from any branch other than `main`.

### Triggering a release

```bash
# Release Mobile P1 — auto-bump version from commit messages
gh workflow run gallery-release-mobile.yml --ref main

# Release Mobile P1 — explicit version
gh workflow run gallery-release-mobile.yml --ref main -f version=v4.2.6

# Release Gallery P2 — promote (after mobile is live on both stores)
gh workflow run gallery-release.yml --ref main

# Release Gallery Server-only — ship server/web/docs without waiting for mobile
gh workflow run gallery-release-server-only.yml --ref main
```

### Recovering from mobile rejection

If a store rejects the mobile build, discard the draft and rerun phase 1 after fixing:

```bash
gh release delete vX.Y.Z --cleanup-tag --yes
```

See `docs/plans/2026-04-17-split-mobile-server-release-design.md` for the full design.
