# AGPL Compliance & Source Attribution for Noodle Gallery Rebrand

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure AGPL-3.0 Section 13 compliance when the Noodle Gallery rebrand is active — users interacting over the network can find the source code of the version they're running.

**Architecture:** Hybrid build-time + runtime approach. The `apply-branding.sh` script patches hardcoded frontend URLs at build time (since SvelteKit bakes values). Server-side values flow through existing `IMMICH_*` env vars with correct defaults set in Docker Compose by the branding script. The HelpAndFeedbackModal sections are inverted: fork resources become primary, upstream Immich becomes a secondary "Upstream Project" attribution section.

**Tech Stack:** SvelteKit (Svelte 5), NestJS (TypeScript), Bash (branding scripts), Vitest (tests)

---

### Task 1: Add repository fields to branding config

**Files:**

- Modify: `branding/config.json`

**Step 1: Add repository and upstream sections to config**

Replace the current config with expanded version:

```json
{
  "name": "Noodle Gallery",
  "name_short": "Gallery",
  "name_slug": "noodle-gallery",
  "name_snake": "noodle_gallery",
  "description": "Self-hosted photo and video management solution",

  "repository": {
    "name": "open-noodle/gallery",
    "url": "https://github.com/open-noodle/gallery",
    "docs_url": "https://github.com/open-noodle/gallery/tree/main/docs",
    "issues_url": "https://github.com/open-noodle/gallery/issues/new/choose",
    "releases_url": "https://github.com/open-noodle/gallery/releases"
  },

  "upstream": {
    "name": "Immich",
    "url": "https://github.com/immich-app/immich",
    "docs_url": "https://docs.immich.app",
    "discord_url": "https://discord.immich.app"
  },

  "mobile": {
    "bundle_id": "app.noodle.gallery",
    "bundle_id_debug": "app.noodle.gallery.debug",
    "bundle_id_profile": "app.noodle.gallery.profile",
    "deep_link_scheme": "noodle-gallery",
    "oauth_callback": "app.noodle.gallery:///oauth-callback",
    "shared_group": "group.app.noodle.gallery.share",
    "download_dir": "DCIM/NoodleGallery",
    "background_task_prefix": "app.noodle.gallery.background"
  },

  "docker": {
    "registry": "ghcr.io/open-noodle",
    "server_image": "gallery-server",
    "ml_image": "gallery-ml"
  },

  "cli": {
    "bin_name": "noodle-gallery",
    "config_dir_name": "noodle-gallery"
  },

  "docs": {
    "title": "Noodle Gallery",
    "url": "https://docs.noodle.gallery"
  },

  "upstream_name": "Immich",
  "upstream_name_lower": "immich"
}
```

**Step 2: Commit**

```bash
git add branding/config.json
git commit -m "feat(branding): add repository and upstream URL fields to config"
```

---

### Task 2: Add i18n keys for upstream attribution section

**Files:**

- Modify: `i18n/en.json`
- Modify: `branding/i18n/overrides-en.json`

**Step 1: Add new i18n key to `i18n/en.json`**

Add this key (alphabetical placement near other "upstream" keys):

```json
"upstream_project": "Upstream Project"
```

This is the section header for the secondary Immich attribution in the help modal.

**Step 2: Add the override to `branding/i18n/overrides-en.json`**

The existing `official_immich_resources` override already says "Official Noodle Gallery Resources" — that stays as the primary section label. No new override needed for `upstream_project` since it should remain "Upstream Project" after branding.

**Step 3: Commit**

```bash
git add i18n/en.json branding/i18n/overrides-en.json
git commit -m "feat(branding): add upstream_project i18n key"
```

---

### Task 3: Invert HelpAndFeedbackModal sections

**Files:**

- Modify: `web/src/lib/modals/HelpAndFeedbackModal.svelte`

**Step 1: Rewrite the modal to invert the sections**

The current structure is:

1. "Official Immich Resources" (hardcoded upstream links) — primary
2. "Third-Party Resources" (env-var-driven fork links) — secondary, conditional

The new structure should be:

1. "Official Immich Resources" (i18n key, which branding overrides to "Official Noodle Gallery Resources") — shows hardcoded links that the branding script will patch
2. "Upstream Project" — secondary section showing "Based on {upstream_name}" with upstream repo, docs, Discord links

Replace the full content of `HelpAndFeedbackModal.svelte` with:

```svelte
<script lang="ts">
  import { type ServerAboutResponseDto } from '@immich/sdk';
  import { Icon, Modal, ModalBody } from '@immich/ui';
  import { mdiBugOutline, mdiFaceAgent, mdiGit, mdiGithub, mdiInformationOutline } from '@mdi/js';
  import { type SimpleIcon, siDiscord } from 'simple-icons';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: () => void;
    info: ServerAboutResponseDto;
  }

  let { onClose, info }: Props = $props();
</script>

{#snippet link(url: string, icon: string | SimpleIcon, text: string)}
  <div>
    <a href={url} target="_blank" rel="noreferrer">
      <Icon {icon} size="1.5em" class="inline-block" />
      <p class="font-medium text-primary text-sm underline inline-block">
        {text}
      </p>
    </a>
  </div>
{/snippet}

<Modal title={$t('support_and_feedback')} {onClose} size="small">
  <ModalBody>
    <p>{$t('official_immich_resources')}</p>
    <div class="flex flex-col gap-2 mt-5">
      {@render link(
        `https://docs.${info.version}.archive.immich.app/overview/introduction`,
        mdiInformationOutline,
        $t('documentation'),
      )}

      {@render link('https://github.com/immich-app/immich/', mdiGithub, $t('source'))}

      {@render link('https://discord.immich.app', siDiscord, $t('discord'))}

      {@render link(
        'https://github.com/immich-app/immich/issues/new/choose',
        mdiBugOutline,
        $t('bugs_and_feature_requests'),
      )}
    </div>

    <p class="mt-5 text-sm text-muted">{$t('upstream_project')}</p>
    <div class="flex flex-col gap-2 mt-2">
      {@render link('https://github.com/immich-app/immich', mdiGithub, 'Immich')}
      {@render link('https://docs.immich.app', mdiInformationOutline, $t('documentation'))}
      {@render link('https://discord.immich.app', siDiscord, $t('discord'))}
    </div>
  </ModalBody>
</Modal>
```

Wait — this doesn't quite work. The hardcoded links in the primary section need to be patchable by the branding script. The upstream section should always show Immich links regardless of branding. Let me reconsider.

The correct approach: keep the current file structure mostly intact (hardcoded URLs that the branding script patches), but ADD the upstream attribution section at the bottom. The branding script will:

- Replace the primary section's URLs with `open-noodle/gallery` URLs
- The upstream section at the bottom always shows Immich attribution

So the actual change to the modal is just adding the upstream section:

```svelte
<script lang="ts">
  import { type ServerAboutResponseDto } from '@immich/sdk';
  import { Icon, Modal, ModalBody } from '@immich/ui';
  import { mdiBugOutline, mdiFaceAgent, mdiGit, mdiGithub, mdiInformationOutline } from '@mdi/js';
  import { type SimpleIcon, siDiscord } from 'simple-icons';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: () => void;
    info: ServerAboutResponseDto;
  }

  let { onClose, info }: Props = $props();
</script>

{#snippet link(url: string, icon: string | SimpleIcon, text: string)}
  <div>
    <a href={url} target="_blank" rel="noreferrer">
      <Icon {icon} size="1.5em" class="inline-block" />
      <p class="font-medium text-primary text-sm underline inline-block">
        {text}
      </p>
    </a>
  </div>
{/snippet}

<Modal title={$t('support_and_feedback')} {onClose} size="small">
  <ModalBody>
    <p>{$t('official_immich_resources')}</p>
    <div class="flex flex-col gap-2 mt-5">
      {@render link(
        `https://docs.${info.version}.archive.immich.app/overview/introduction`,
        mdiInformationOutline,
        $t('documentation'),
      )}

      {@render link('https://github.com/immich-app/immich/', mdiGithub, $t('source'))}

      {@render link('https://discord.immich.app', siDiscord, $t('discord'))}

      {@render link(
        'https://github.com/immich-app/immich/issues/new/choose',
        mdiBugOutline,
        $t('bugs_and_feature_requests'),
      )}
    </div>
    {#if info.thirdPartyBugFeatureUrl || info.thirdPartySourceUrl || info.thirdPartyDocumentationUrl || info.thirdPartySupportUrl}
      <p class="mt-5">{$t('third_party_resources')}</p>
      <p class="text-sm mt-1">
        {$t('support_third_party_description')}
      </p>
      <div class="flex flex-col gap-2 mt-5">
        {#if info.thirdPartyDocumentationUrl}
          {@render link(info.thirdPartyDocumentationUrl, mdiInformationOutline, $t('documentation'))}
        {/if}

        {#if info.thirdPartySourceUrl}
          {@render link(info.thirdPartySourceUrl, mdiGit, $t('source'))}
        {/if}

        {#if info.thirdPartySupportUrl}
          {@render link(info.thirdPartySupportUrl, mdiFaceAgent, $t('support'))}
        {/if}

        {#if info.thirdPartyBugFeatureUrl}
          {@render link(info.thirdPartyBugFeatureUrl, mdiBugOutline, $t('bugs_and_feature_requests'))}
        {/if}
      </div>
    {/if}

    <!-- BRANDING:UPSTREAM_START -->
    <p class="mt-5 text-sm text-muted">{$t('upstream_project')}</p>
    <div class="flex flex-col gap-2 mt-2">
      {@render link('https://github.com/immich-app/immich', mdiGithub, 'Immich')}
      {@render link('https://docs.immich.app', mdiInformationOutline, $t('documentation'))}
      {@render link('https://discord.immich.app', siDiscord, $t('discord'))}
    </div>
    <!-- BRANDING:UPSTREAM_END -->
  </ModalBody>
</Modal>
```

The `BRANDING:UPSTREAM_START/END` markers let the branding script know this section is the upstream attribution — it should NOT be removed (AGPL compliance), but the branding script can restyle it if needed.

On an unbranded build (current main), the upstream section is redundant with the primary section (both show Immich links). That's fine — it's harmless and invisible to end users since it just duplicates the info. After branding, the primary section becomes Noodle Gallery links and the upstream section provides the required Immich attribution.

**Step 2: Commit**

```bash
git add web/src/lib/modals/HelpAndFeedbackModal.svelte
git commit -m "feat(web): add upstream project attribution section to help modal"
```

---

### Task 4: Update apply-branding.sh to patch help modal URLs

**Files:**

- Modify: `branding/scripts/apply-branding.sh`

**Step 1: Read config values for repository URLs**

Add after the existing config reads at the top of the script:

```bash
# Repository
REPO_NAME=$(jq -r '.repository.name' "$CONFIG")
REPO_URL=$(jq -r '.repository.url' "$CONFIG")
REPO_DOCS_URL=$(jq -r '.repository.docs_url' "$CONFIG")
REPO_ISSUES_URL=$(jq -r '.repository.issues_url' "$CONFIG")
REPO_RELEASES_URL=$(jq -r '.repository.releases_url' "$CONFIG")

# Upstream
UPSTREAM_NAME=$(jq -r '.upstream.name' "$CONFIG")
UPSTREAM_URL=$(jq -r '.upstream.url' "$CONFIG")
UPSTREAM_DOCS_URL=$(jq -r '.upstream.docs_url' "$CONFIG")
UPSTREAM_DISCORD_URL=$(jq -r '.upstream.discord_url' "$CONFIG")
```

**Step 2: Add `patch_help_modal` function**

Add this function before `main()`:

```bash
#
# --- Help & About Modals ---
#
patch_help_modal() {
  echo "--- Patching help modal URLs ---"

  local help_modal="$REPO_ROOT/web/src/lib/modals/HelpAndFeedbackModal.svelte"

  # Replace primary section URLs with fork URLs
  sed -i "s|https://docs\.\${info\.version}\.archive\.immich\.app/overview/introduction|${REPO_DOCS_URL}|g" "$help_modal"
  sed -i "s|https://github\.com/immich-app/immich/issues/new/choose|${REPO_ISSUES_URL}|g" "$help_modal"

  # Replace primary source link (but not the one in BRANDING:UPSTREAM section)
  # Use line-range-aware sed: only replace the first occurrence (primary section)
  sed -i "0,/https:\/\/github\.com\/immich-app\/immich\//s|https://github\.com/immich-app/immich/|${REPO_URL}|" "$help_modal"

  # Remove the third-party section (not needed when we ARE the primary)
  sed -i '/thirdPartyBugFeatureUrl\|thirdPartySourceUrl\|thirdPartyDocumentationUrl\|thirdPartySupportUrl\|third_party_resources\|support_third_party_description/d' "$help_modal"

  echo "  Patched HelpAndFeedbackModal.svelte"
}
```

**Step 3: Add `patch_help_modal` call to `main()`**

Add `patch_help_modal` after `patch_web` in the main function.

**Step 4: Commit**

```bash
git add branding/scripts/apply-branding.sh
git commit -m "feat(branding): patch help modal URLs with fork repository links"
```

---

### Task 5: Make server versionUrl configurable

**Files:**

- Modify: `server/src/services/server.service.ts`
- Modify: `server/src/services/server.service.spec.ts`

**Step 1: Write failing test for configurable versionUrl**

In `server/src/services/server.service.spec.ts`, add a new test in the `getAboutInfo` describe block:

```typescript
it('should use repositoryUrl from build metadata for versionUrl when available', async () => {
  mocks.serverInfo.getBuildVersions.mockResolvedValue({
    nodejs: '18.0.0',
    ffmpeg: '6.0',
    imagemagick: '7.1.0',
    libvips: '8.14.0',
    exiftool: '12.0',
  });
  mocks.systemMetadata.get.mockResolvedValue(null);
  mocks.config.getEnv.mockReturnValue(
    mockEnvData({
      buildMetadata: {
        repositoryUrl: 'https://github.com/open-noodle/gallery',
      },
    }),
  );

  const result = await sut.getAboutInfo();
  expect(result.versionUrl).toBe(`https://github.com/open-noodle/gallery/releases/tag/${result.version}`);
});
```

**Step 2: Run test to verify it fails**

```bash
cd server && pnpm test -- --run src/services/server.service.spec.ts
```

Expected: FAIL — `versionUrl` still hardcodes `immich-app/immich`.

**Step 3: Update `getAboutInfo` to derive versionUrl from env**

In `server/src/services/server.service.ts`, change the `getAboutInfo` method:

```typescript
async getAboutInfo(): Promise<ServerAboutResponseDto> {
  const version = `v${serverVersion.toString()}`;
  const { buildMetadata } = this.configRepository.getEnv();
  const buildVersions = await this.serverInfoRepository.getBuildVersions();
  const licensed = await this.systemMetadataRepository.get(SystemMetadataKey.License);

  const repoUrl = buildMetadata.repositoryUrl || 'https://github.com/immich-app/immich';

  return {
    version,
    versionUrl: `${repoUrl}/releases/tag/${version}`,
    licensed: !!licensed,
    ...buildMetadata,
    ...buildVersions,
  };
}
```

**Step 4: Run test to verify it passes**

```bash
cd server && pnpm test -- --run src/services/server.service.spec.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add server/src/services/server.service.ts server/src/services/server.service.spec.ts
git commit -m "feat(server): derive versionUrl from IMMICH_REPOSITORY_URL env var"
```

---

### Task 6: Make APK links configurable

**Files:**

- Modify: `server/src/services/server.service.ts`
- Modify: `server/src/services/server.service.spec.ts`

**Step 1: Write failing test**

Add in the `getApkLinks` describe block:

```typescript
it('should use repositoryUrl from build metadata for APK links', () => {
  mocks.config.getEnv.mockReturnValue(
    mockEnvData({
      buildMetadata: {
        repositoryUrl: 'https://github.com/open-noodle/gallery',
      },
    }),
  );

  const result = sut.getApkLinks();
  const version = serverVersion.toString();

  expect(result.universal).toBe(`https://github.com/open-noodle/gallery/releases/download/v${version}/app-release.apk`);
});
```

**Step 2: Run test to verify it fails**

```bash
cd server && pnpm test -- --run src/services/server.service.spec.ts
```

**Step 3: Update `getApkLinks` to use env var**

```typescript
getApkLinks(): ServerApkLinksDto {
  const { buildMetadata } = this.configRepository.getEnv();
  const repoUrl = buildMetadata.repositoryUrl || 'https://github.com/immich-app/immich';
  const baseUrl = `${repoUrl}/releases/download/v${serverVersion.toString()}`;
  return {
    arm64v8a: `${baseUrl}/app-arm64-v8a-release.apk`,
    armeabiv7a: `${baseUrl}/app-armeabi-v7a-release.apk`,
    universal: `${baseUrl}/app-release.apk`,
    x86_64: `${baseUrl}/app-x86_64-release.apk`,
  };
}
```

**Step 4: Run test to verify it passes**

```bash
cd server && pnpm test -- --run src/services/server.service.spec.ts
```

**Step 5: Commit**

```bash
git add server/src/services/server.service.ts server/src/services/server.service.spec.ts
git commit -m "feat(server): derive APK download links from IMMICH_REPOSITORY_URL"
```

---

### Task 7: Update ServerAboutModal main branch warning

**Files:**

- Modify: `web/src/lib/modals/ServerAboutModal.svelte`

**Step 1: Update the condition to also match the fork repo**

Change line 21 from:

```svelte
{#if info.sourceRef === 'main' && info.repository === 'immich-app/immich'}
```

to:

```svelte
{#if info.sourceRef === 'main' && (info.repository === 'immich-app/immich' || info.repository === 'open-noodle/gallery')}
```

**Step 2: Commit**

```bash
git add web/src/lib/modals/ServerAboutModal.svelte
git commit -m "feat(web): show main branch warning for fork repo too"
```

---

### Task 8: Update apply-branding.sh to set Docker env vars

**Files:**

- Modify: `branding/scripts/apply-branding.sh`

**Step 1: Extend `patch_docker` to set env vars**

Add environment variable defaults to the Docker Compose files so the server knows its identity:

```bash
patch_docker() {
  echo "--- Patching Docker configs ---"

  local compose_dir="$REPO_ROOT/docker"
  for f in "$compose_dir"/docker-compose*.yml; do
    if [[ -f "$f" ]]; then
      # Replace upstream image references
      sed -i "s|ghcr\.io/immich-app/immich-server|${DOCKER_REGISTRY}/${DOCKER_SERVER_IMAGE}|g" "$f"
      sed -i "s|ghcr\.io/immich-app/immich-machine-learning|${DOCKER_REGISTRY}/${DOCKER_ML_IMAGE}|g" "$f"
      echo "  Patched $(basename "$f")"
    fi
  done

  # Add env vars to .env.example so deployers get correct defaults
  local env_example="$REPO_ROOT/docker/.env.example"
  if [[ -f "$env_example" ]]; then
    cat >> "$env_example" <<EOF

# Noodle Gallery branding
IMMICH_REPOSITORY=${REPO_NAME}
IMMICH_REPOSITORY_URL=${REPO_URL}
EOF
    echo "  Added branding env vars to .env.example"
  fi
}
```

**Step 2: Commit**

```bash
git add branding/scripts/apply-branding.sh
git commit -m "feat(branding): set IMMICH_REPOSITORY env vars in Docker config"
```

---

### Task 9: Extend verify-branding.sh for URL leak detection

**Files:**

- Modify: `branding/scripts/verify-branding.sh`

**Step 1: Add URL leak checks**

Add after the existing checks, before the final exit:

```bash
# Check that hardcoded upstream URLs have been replaced in user-facing frontend
url_check_files=(
  "web/src/lib/modals/HelpAndFeedbackModal.svelte"
)

for file in "${url_check_files[@]}"; do
  filepath="$REPO_ROOT/$file"
  if [[ -f "$filepath" ]]; then
    # Check for upstream GitHub URLs outside the BRANDING:UPSTREAM section
    # Extract content outside the upstream markers
    outside_upstream=$(sed '/BRANDING:UPSTREAM_START/,/BRANDING:UPSTREAM_END/d' "$filepath")
    if echo "$outside_upstream" | grep -q "github\.com/immich-app/immich"; then
      echo "  WARN: Upstream GitHub URL found outside upstream section in $file"
      EXIT_CODE=1
    else
      echo "  OK: $file (URLs patched)"
    fi
  fi
done

# Verify Docker env vars are set
env_example="$REPO_ROOT/docker/.env.example"
if [[ -f "$env_example" ]]; then
  if grep -q "IMMICH_REPOSITORY=" "$env_example"; then
    echo "  OK: .env.example has IMMICH_REPOSITORY"
  else
    echo "  WARN: .env.example missing IMMICH_REPOSITORY"
    EXIT_CODE=1
  fi
fi
```

**Step 2: Commit**

```bash
git add branding/scripts/verify-branding.sh
git commit -m "feat(branding): extend verify script with URL leak detection"
```

---

### Task 10: Update branding config docker registry to open-noodle

**Files:**

- Already done in Task 1 (config.json registry set to `ghcr.io/open-noodle`)

This is a no-op — covered by Task 1. Verify the existing docker workflow references are consistent.

**Step 1: Check docker workflow for old registry references**

```bash
grep -n "deeds67\|Deeds67" .github/workflows/docker.yml
```

If any references to the old `deeds67` registry exist, update them to `open-noodle`.

**Step 2: Commit if changes needed**

```bash
git add .github/workflows/docker.yml
git commit -m "chore: update Docker registry from deeds67 to open-noodle"
```

---

### Task 11: Final verification

**Step 1: Run web tests**

```bash
cd web && pnpm test -- --run
```

**Step 2: Run server tests**

```bash
cd server && pnpm test -- --run src/services/server.service.spec.ts
```

**Step 3: Run branding apply + verify (dry check)**

```bash
# Test in a temporary copy to avoid polluting the working tree
git stash
bash branding/scripts/apply-branding.sh
bash branding/scripts/verify-branding.sh
git checkout -- .
git stash pop
```

**Step 4: Run lint and type checks**

```bash
make check-web
make check-server
make lint-web
make lint-server
```

**Step 5: Commit any fixes and create PR**
