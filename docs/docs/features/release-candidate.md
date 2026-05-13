# Release Candidate (RC)

The Release Candidate channel is an opt-in track for the next Immich version, published roughly one week ahead of the official release. RC builds are labeled `vX.Y.Z-rc.N` and may contain bugs — testers help us catch them before everyone else gets the update.

## Why participate

Joining the RC channel lets you preview the next version, surface regressions that are easier to fix before release, and shape the build that lands for everyone. Feedback you give here makes it into the final cut.

## iOS — Public TestFlight

1. Install Apple's [TestFlight](https://apps.apple.com/app/testflight/id899247664) app.
2. Open the public RC TestFlight link: `<TESTFLIGHT_LINK_PLACEHOLDER>`.
3. Tap **Accept**, then **Install**.

:::info Separate app on your device
The RC build is a distinct app — "Immich RC" — that installs alongside your production Immich. Your data is not shared between the two. Sign in to your server in the RC app the same way you would on a fresh install.
:::

## Android — Open Testing

1. Open the Play Store opt-in link: `<PLAY_STORE_OPT_IN_PLACEHOLDER>`.
2. Tap **Become a tester**.

:::warning RC replaces your production install
Android RC builds use the same package name as production Immich, so the Play Store delivers them as updates on top of your existing install. This is a one-way change until you opt out and reinstall — there is no separate "Immich RC" app on Android.
:::

## Server, web, CLI

RC server images are not part of this initial rollout. For now, if you want to test an RC backend alongside an RC mobile build, build the server from the `vX.Y.Z-rc.N` git tag yourself. We may publish `:rc` Docker tags later.

## Reporting bugs

Open a GitHub issue at the [Immich issue tracker](https://github.com/immich-app/immich/issues). Mention that you are on an RC build and include the version string (`vX.Y.Z-rc.N`) so we can correlate reports across testers.

:::note
Test against a non-critical library or a staging instance — not your only copy of family photos. RCs are pre-release software and may have bugs that affect data.
:::

## Leaving the RC channel

- **iOS**: Open TestFlight → Immich RC → **Stop Testing**. The RC app stays installed until you delete it; deleting it does not affect your production Immich install.
- **Android**: Open the Play Store → Immich → scroll to **You're a tester** → leave the program. Then uninstall and reinstall Immich to drop back to the production track.

## Cadence

We typically publish one to three RCs in the ~1 week before each minor release. Patch releases usually skip the RC stage and ship straight to production.
