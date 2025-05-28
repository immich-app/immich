<script lang="ts">
  import {
    getAboutInfo,
    getServerVersion,
    type ServerAboutResponseDto,
    type ServerVersionResponseDto,
  } from '@immich/sdk';
  import { Modal, ModalBody } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  let info: ServerAboutResponseDto | undefined = $state();
  let version: ServerVersionResponseDto | undefined = $state();
  let strVersion: string | undefined = $state();
  onMount(async () => {
    info = await getAboutInfo();
    version = await getServerVersion();
    strVersion = `v${version?.major}.${version?.minor}.${version?.patch}`;
  });

  //let strVersion = version?.major;

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
</script>

<Modal title={$t('download')} {onClose}>
  <ModalBody>
    <div class="flex flex-col sm:grid sm:grid-cols-2 gap-1 text-immich-primary dark:text-immich-dark-primary">
      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="version-desc"
          >Immich</label
        >
        <div>
          <a
            href={info?.versionUrl}
            class="underline text-sm immich-form-label"
            target="_blank"
            rel="noreferrer"
            id="version-desc"
          >
            {version}{strVersion}
          </a>
        </div>
      </div>

      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="ffmpeg-desc"
          >ExifTool</label
        >
        <p class="immich-form-label pb-2 text-sm" id="ffmpeg-desc">
          {info?.exiftool}
        </p>
      </div>

      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="nodejs-desc"
          >Node.js</label
        >
        <p class="immich-form-label pb-2 text-sm" id="nodejs-desc">
          {info?.nodejs}
        </p>
      </div>

      <div>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="vips-desc"
          >Libvips</label
        >
        <p class="immich-form-label pb-2 text-sm" id="vips-desc">
          {info?.libvips}
        </p>
      </div>

      <div class={(info?.imagemagick?.length || 0) > 10 ? 'col-span-2' : ''}>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="imagemagick-desc"
          >ImageMagick</label
        >
        <p class="immich-form-label pb-2 text-sm" id="imagemagick-desc">
          {info?.imagemagick}
        </p>
      </div>

      <div class={(info?.ffmpeg?.length || 0) > 10 ? 'col-span-2' : ''}>
        <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="ffmpeg-desc"
          >FFmpeg</label
        >
        <p class="immich-form-label pb-2 text-sm" id="ffmpeg-desc">
          {info?.ffmpeg}
        </p>
      </div>

      {#if info?.repository && info?.repositoryUrl}
        <div>
          <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="version-desc"
            >{$t('repository')}</label
          >
          <div>
            <a
              href={info?.repositoryUrl}
              class="underline text-sm immich-form-label"
              target="_blank"
              rel="noreferrer"
              id="version-desc"
            >
              {info?.repository}
            </a>
          </div>
        </div>
      {/if}

      {#if info?.sourceRef && info?.sourceCommit && info?.sourceUrl}
        <div>
          <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="git-desc"
            >{$t('source')}</label
          >
          <div>
            <a
              href={info?.sourceUrl}
              class="underline text-sm immich-form-label"
              target="_blank"
              rel="noreferrer"
              id="git-desc"
            >
              {info?.sourceRef}@{info?.sourceCommit.slice(0, 9)}
            </a>
          </div>
        </div>
      {/if}

      {#if info?.build && info?.buildUrl}
        <div>
          <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="build-desc"
            >{$t('build')}</label
          >
          <div>
            <a
              href={info?.buildUrl}
              class="underline text-sm immich-form-label"
              target="_blank"
              rel="noreferrer"
              id="build-desc"
            >
              {info?.build}
            </a>
          </div>
        </div>
      {/if}

      {#if info?.buildImage && info?.buildImage}
        <div>
          <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="build-image-desc"
            >{$t('build_image')}</label
          >
          <div>
            <a
              href={info?.buildImageUrl}
              class="underline text-sm immich-form-label"
              target="_blank"
              rel="noreferrer"
              id="build-image-desc"
            >
              {info?.buildImage}
            </a>
          </div>
        </div>
      {/if}
    </div>
  </ModalBody>
</Modal>
