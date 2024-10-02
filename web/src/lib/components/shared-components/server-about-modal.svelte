<script lang="ts">
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { type ServerAboutResponseDto, type ServerVersionHistoryResponseDto } from '@immich/sdk';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  export let onClose: () => void;

  export let info: ServerAboutResponseDto;
  export let versions: ServerVersionHistoryResponseDto[];
</script>

<Portal>
  <FullScreenModal title={$t('about')} {onClose}>
    <div class="flex flex-col sm:grid sm:grid-cols-2 gap-1 text-immich-primary dark:text-immich-dark-primary">
      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="version-desc"
          >Immich</label
        >
        <div>
          <a
            href={info.versionUrl}
            class="underline text-sm immich-form-label"
            target="_blank"
            rel="noreferrer"
            id="version-desc"
          >
            {info.version}
          </a>
        </div>
      </div>

      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="ffmpeg-desc"
          >ExifTool</label
        >
        <p class="immich-form-label pb-2 text-sm" id="ffmpeg-desc">
          {info.exiftool}
        </p>
      </div>

      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="nodejs-desc"
          >Node.js</label
        >
        <p class="immich-form-label pb-2 text-sm" id="nodejs-desc">
          {info.nodejs}
        </p>
      </div>

      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="vips-desc"
          >Libvips</label
        >
        <p class="immich-form-label pb-2 text-sm" id="vips-desc">
          {info.libvips}
        </p>
      </div>

      <div class={(info.imagemagick?.length || 0) > 10 ? 'col-span-2' : ''}>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="imagemagick-desc"
          >ImageMagick</label
        >
        <p class="immich-form-label pb-2 text-sm" id="imagemagick-desc">
          {info.imagemagick}
        </p>
      </div>

      <div class={(info.ffmpeg?.length || 0) > 10 ? 'col-span-2' : ''}>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="ffmpeg-desc"
          >FFmpeg</label
        >
        <p class="immich-form-label pb-2 text-sm" id="ffmpeg-desc">
          {info.ffmpeg}
        </p>
      </div>

      {#if info.repository && info.repositoryUrl}
        <div>
          <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="version-desc"
            >{$t('repository')}</label
          >
          <div>
            <a
              href={info.repositoryUrl}
              class="underline text-sm immich-form-label"
              target="_blank"
              rel="noreferrer"
              id="version-desc"
            >
              {info.repository}
            </a>
          </div>
        </div>
      {/if}

      {#if info.sourceRef && info.sourceCommit && info.sourceUrl}
        <div>
          <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="git-desc"
            >{$t('source')}</label
          >
          <div>
            <a
              href={info.sourceUrl}
              class="underline text-sm immich-form-label"
              target="_blank"
              rel="noreferrer"
              id="git-desc"
            >
              {info.sourceRef}@{info.sourceCommit.slice(0, 9)}
            </a>
          </div>
        </div>
      {/if}

      {#if info.build && info.buildUrl}
        <div>
          <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="build-desc"
            >{$t('build')}</label
          >
          <div>
            <a
              href={info.buildUrl}
              class="underline text-sm immich-form-label"
              target="_blank"
              rel="noreferrer"
              id="build-desc"
            >
              {info.build}
            </a>
          </div>
        </div>
      {/if}

      {#if info.buildImage && info.buildImage}
        <div>
          <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="build-image-desc"
            >{$t('build_image')}</label
          >
          <div>
            <a
              href={info.buildImageUrl}
              class="underline text-sm immich-form-label"
              target="_blank"
              rel="noreferrer"
              id="build-image-desc"
            >
              {info.buildImage}
            </a>
          </div>
        </div>
      {/if}

      <div class="col-span-full">
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="version-history"
          >{$t('version_history')}</label
        >
        <ul id="version-history" class="list-none">
          {#each versions.slice(0, 5) as item (item.id)}
            {@const createdAt = DateTime.fromISO(item.createdAt)}
            <li>
              <span
                class="immich-form-label pb-2 text-xs"
                id="version-history"
                title={createdAt.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}
              >
                {$t('version_history_item', {
                  values: {
                    version: item.version,
                    date: createdAt.toLocaleString({
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }),
                  },
                })}
              </span>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </FullScreenModal>
</Portal>
