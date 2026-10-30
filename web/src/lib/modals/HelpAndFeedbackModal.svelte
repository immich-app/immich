<script lang="ts">
  import FormatMessage from '#lib/elements/FormatMessage.svelte';
  import { ExternalRoute } from '#lib/route.ts';
  import { type ServerAboutResponseDto } from '@immich/sdk';
  import { Heading, Icon, Link, Modal, ModalBody, Stack, Text } from '@immich/ui';
  import { mdiBugOutline, mdiFaceAgent, mdiGit, mdiGithub, mdiInformationOutline } from '@mdi/js';
  import { type SimpleIcon, siDiscord } from 'simple-icons';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: () => void;
    info: ServerAboutResponseDto;
  };

  const { onClose, info }: Props = $props();
  const isThirdParty = $derived(
    info.thirdPartyBugFeatureUrl ||
      info.thirdPartySourceUrl ||
      info.thirdPartyDocumentationUrl ||
      info.thirdPartySupportUrl,
  );
</script>

{#snippet link(url: string | undefined, icon: string | SimpleIcon, text: string)}
  {#if url}
    <div class="flex gap-2">
      <Icon {icon} size="1.5em" />
      <Link href={url} class="text-sm text-primary">{text}</Link>
    </div>
  {/if}
{/snippet}

<Modal title={$t('support_and_feedback')} {onClose} size="small">
  <ModalBody>
    {#if isThirdParty}
      <Heading size="tiny">{$t('third_party_resources')}</Heading>
      <Text>{$t('support_third_party_description')}</Text>
      <Stack class="my-5">
        {@render link(info.thirdPartyDocumentationUrl, mdiInformationOutline, $t('documentation'))}
        {@render link(info.thirdPartySourceUrl, mdiGit, $t('source'))}
        {@render link(info.thirdPartySupportUrl, mdiFaceAgent, $t('support'))}
        {@render link(info.thirdPartyBugFeatureUrl, mdiBugOutline, $t('bugs_and_feature_requests'))}
      </Stack>
    {/if}

    <Heading size="tiny">{$t('official_immich_resources')}</Heading>
    {#if isThirdParty}
      <Text>
        <FormatMessage key="support_ensure_latest">
          {#snippet children({ message })}
            <Link href="https://github.com/immich-app/immich/releases">{message}</Link>
          {/snippet}
        </FormatMessage>
      </Text>
    {/if}

    <Stack class="mt-5">
      {@render link(ExternalRoute.archivedDocs(info.version), mdiInformationOutline, $t('documentation'))}
      {@render link('https://github.com/immich-app/immich/', mdiGithub, $t('source'))}
      {@render link('https://discord.immich.app', siDiscord, $t('discord'))}
      {@render link(
        'https://github.com/immich-app/immich/issues/new/choose',
        mdiBugOutline,
        $t('bugs_and_feature_requests'),
      )}
    </Stack>
  </ModalBody>
</Modal>
