# Remove the temporary walkrs CI workaround

This is a handoff for the agent that removes this workaround after the walkrs
metadata changes are merged and published to npm. Make targeted edits; preserve
the application changes that use the new walker API and any unrelated work.

## Why this exists

The server currently depends on `@immich/walkrs` through
`"link:../../walkrs"` in `server/package.json`. Relative to the repository root,
that package must exist at `../walkrs`.

The required source is
[`immich-app/walkrs`, branch `feat/metadata`](https://github.com/immich-app/walkrs/tree/feat/metadata).
The branch head when this workaround was added was
`ad547bc7e47a3d6b76008b80c5c8ce8a48abacfa` (`add created time`). The checkout
declares version `0.0.13`; that version string alone does not establish that a
published package contains these changes.

`.github/actions/setup-walkrs/action.yml` clones the branch into the sibling
directory, installs Rust, and builds the native module before server checks run.
`server/Dockerfile` builds the same branch at `/usr/src/walkrs` and copies it into
the server build and runtime images. Its server deployment uses `--legacy`
because normal pnpm deployment fails with the temporary `link:` dependency.

The workflows also use GitHub's `$/...` self-repository references and disable
dependency caching in the end-to-end jobs. These security fixes are independent
of walkrs; keep them when removing the workaround.

Jellyfin FFmpeg is a separate mise tool. Preserve its platform entries in
`mise.lock` when cleaning up walkrs. `mise.toml` declares Linux x64, Linux arm64,
macOS x64, and macOS arm64. If one is missing, update only Jellyfin's lock data
for all declared platforms:

```bash
mise lock github:jellyfin/jellyfin-ffmpeg \
  --platform linux-x64,linux-arm64,macos-x64,macos-arm64,windows-x64
```

## Confirm that a suitable release exists

1. Verify that the metadata changes from `feat/metadata` have been merged and
   included in a published `@immich/walkrs` release. Check the upstream release
   and the actual npm package, rather than assuming that the latest version is
   suitable.
2. Confirm that the release provides the types and behavior required by the
   current server. At the time of this workaround, those include `WalkBatch`,
   `WalkError`, the `includeMetadata` option, and batches containing `files`,
   `size`, `modified`, `created`, and `errors`. Metadata includes file sizes and
   modification/birth times; unavailable birth times may be `null`.
3. Confirm that the published native artifacts support both CI Docker targets:
   Linux amd64 and arm64. Consumers should be able to load the published package
   without building the sibling Rust checkout.

## Replace the dependency and remove the workaround

1. From the repository root, use the repository's configured Node and pnpm
   versions to replace the server dependency with the verified release. Replace
   the placeholder below with the real published version:

   ```bash
   pnpm --filter immich add '@immich/walkrs@<published-version>'
   ```

   Review both `server/package.json` and `pnpm-lock.yaml`. The dependency must
   resolve from npm, with no `link:../../walkrs` entry. Regenerate the lockfile
   through pnpm; do not fabricate lockfile entries manually.

2. Remove every `Setup walkrs` step using
   `$/.github/actions/setup-walkrs`. The original callers are:

   - `.github/workflows/test.yml`: `server-unit-tests`, `server-medium-tests`,
     `generated-api-up-to-date`, and `sql-schema-up-to-date`.
   - `.github/workflows/migration-order.yml`.
   - `.github/workflows/fix-format.yml`.
   - `.github/workflows/draft-release.yml`.
   - `.github/workflows/prepare-release.yml`.

   Search for additional callers added since this guide was written, then delete
   `.github/actions/setup-walkrs/action.yml` and its empty directory. Remove
   `'.github/actions/setup-walkrs/**'` from the server path filter in
   `.github/workflows/test.yml`.

3. In `server/Dockerfile`, remove only these temporary pieces:

   - The `FROM rust:1.93.1-bookworm@... AS rust` stage.
   - The `FROM builder AS walkrs` stage, including its Rust toolchain copies,
     environment variables, working directory, clone, install, and build.
   - The three `COPY --from=walkrs` instructions in the `server` stage.
   - The runtime `COPY --from=server /usr/src/walkrs /usr/src/walkrs` instruction.
   - The runtime `ln -sfn /usr/src/walkrs server/node_modules/@immich/walkrs`
     command. Preserve `ln -s ../../cli/bin/immich server/bin/immich` in that
     `RUN` instruction.
   - The temporary source-build comment.

   Restore the server deployment command to
   `pnpm --filter immich --prod --no-optional deploy /output/server-pruned`,
   removing `--legacy`. Keep the existing SDK, plugin, web, CLI, and server stages
   and their other build/deployment commands.

4. Remove `../../walkrs:/usr/src/walkrs` from the volumes in
   `docker/docker-compose.dev.yml`. This local-development mount predates the CI
   workaround, but becomes unnecessary once the server uses the npm release.
   Leave the developer's separate `../walkrs` repository intact.

## Validate before finishing

Use a clean checkout or an isolated environment with no sibling `../walkrs`
directory. An existing local build can hide a leftover link dependency.

```bash
pnpm install --frozen-lockfile
mise run //server:ci-unit
mise run //server:ci-medium
docker build --target server -f server/Dockerfile .
```

Also run the full server image build and the relevant GitHub CI checks, including
OpenAPI clients, SQL schema, migration order, and server/web end-to-end tests.
Check native module loading from the final runtime image on both supported Linux
architectures, not just TypeScript compilation or installation.

Search for remaining workaround references outside this guide:

```bash
rg -n --hidden -g '!.git/**' -g '!**/node_modules/**' \
  -g '!WALKRS_CI_WORKAROUND.md' \
  'setup-walkrs|link:../../walkrs|feat/metadata|/usr/src/walkrs|\.\./walkrs' \
  .github server docker package.json pnpm-lock.yaml pnpm-workspace.yaml
```

Investigate any remaining matches and verify that CI no longer clones or builds
walkrs source. Remove this guide once the cleanup and validation are complete.
