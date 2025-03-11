<script lang="ts">
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { type ServerAboutResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiBugOutline, mdiFaceAgent, mdiGit, mdiGithub, mdiInformationOutline } from '@mdi/js';
  import { discordPath, discordViewBox } from '$lib/assets/svg-paths';

  interface Props {
    onClose: () => void;
    info: ServerAboutResponseDto;
  }

  let { onClose, info }: Props = $props();
</script>

<Portal>
  <FullScreenModal title={$t('support_and_feedback')} {onClose}>
    <p>{$t('official_immich_resources')}</p>
    <div class="flex flex-col sm:grid sm:grid-cols-2 gap-2 mt-5">
      <div>
        <a href="https://{info.version}.archive.immich.app/docs/overview/introduction" target="_blank" rel="noreferrer">
          <Icon path={mdiInformationOutline} size="1.5em" class="inline-block" />
          <p
            class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm underline inline-block"
            id="documentation-label"
          >
            {$t('documentation')}
          </p>
        </a>
      </div>

      <div>
        <a href="https://github.com/immich-app/immich/" target="_blank" rel="noreferrer">
          <Icon path={mdiGithub} size="1.5em" class="inline-block" />
          <p
            class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm underline inline-block"
            id="github-label"
          >
            {$t('source')}
          </p>
        </a>
      </div>

      <div>
        <a href="https://discord.immich.app" target="_blank" rel="noreferrer">
          <Icon path={discordPath} viewBox={discordViewBox} class="inline-block" size="1.5em" />
          <p
            class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm underline inline-block"
            id="github-label"
          >
            {$t('discord')}
          </p>
        </a>
      </div>

      <div>
        <a href="https://github.com/immich-app/immich/issues/new/choose" target="_blank" rel="noreferrer">
          <Icon path={mdiBugOutline} size="1.5em" class="inline-block" />
          <p
            class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm underline inline-block"
            id="github-label"
          >
            {$t('bugs_and_feature_requests')}
          </p>
        </a>
      </div>
    </div>
    {#if info.thirdPartyBugFeatureUrl || info.thirdPartySourceUrl || info.thirdPartyDocumentationUrl || info.thirdPartySupportUrl}
      <p class="mt-5">{$t('third_party_resources')}</p>
      <p class="text-sm mt-1">
        {$t('support_third_party_description')}
      </p>
      <div class="flex flex-col sm:grid sm:grid-cols-2 gap-2 mt-5">
        {#if info.thirdPartyDocumentationUrl}
          <div>
            <a href={info.thirdPartyDocumentationUrl} target="_blank" rel="noreferrer">
              <Icon path={mdiInformationOutline} size="1.5em" class="inline-block" />
              <p
                class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm underline inline-block"
                id="documentation-label"
              >
                {$t('documentation')}
              </p>
            </a>
          </div>
        {/if}

        {#if info.thirdPartySourceUrl}
          <div>
            <a href={info.thirdPartySourceUrl} target="_blank" rel="noreferrer">
              <Icon path={mdiGit} size="1.5em" class="inline-block" />
              <p
                class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm underline inline-block"
                id="github-label"
              >
                {$t('source')}
              </p>
            </a>
          </div>
        {/if}

        {#if info.thirdPartySupportUrl}
          <div>
            <a href={info.thirdPartySupportUrl} target="_blank" rel="noreferrer">
              <Icon path={mdiFaceAgent} class="inline-block" size="1.5em" />
              <p
                class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm underline inline-block"
                id="github-label"
              >
                {$t('support')}
              </p>
            </a>
          </div>
        {/if}

        {#if info.thirdPartyBugFeatureUrl}
          <div>
            <a href={info.thirdPartyBugFeatureUrl} target="_blank" rel="noreferrer">
              <Icon path={mdiBugOutline} size="1.5em" class="inline-block" />
              <p
                class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm underline inline-block"
                id="github-label"
              >
                {$t('bugs_and_feature_requests')}
              </p>
            </a>
          </div>
        {/if}
      </div>
    {/if}
  </FullScreenModal>
</Portal>
