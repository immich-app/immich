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
  </ModalBody>
</Modal>
