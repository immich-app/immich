<script lang="ts">
  import SharedLinkCopy from '$lib/components/sharedlinks-page/actions/shared-link-copy.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import type { AlbumResponseDto, SharedLinkResponseDto } from '@immich/sdk';
  import { IconButton, Text } from '@immich/ui';
  import { mdiQrcode } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  type Props = {
    album: AlbumResponseDto;
    sharedLink: SharedLinkResponseDto;
    onViewQrCode: () => void;
  };

  const { album, sharedLink, onViewQrCode }: Props = $props();

  const getShareProperties = () =>
    [
      DateTime.fromISO(sharedLink.createdAt).toLocaleString(
        {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        },
        { locale: $locale },
      ),
      sharedLink.allowUpload && $t('upload'),
      sharedLink.allowDownload && $t('download'),
      sharedLink.showMetadata && $t('exif').toUpperCase(),
      sharedLink.password && $t('password'),
    ]
      .filter(Boolean)
      .join(' • ');
</script>

<div class="flex justify-between items-center">
  <div class="flex flex-col gap-1">
    <Text size="small">{sharedLink.description || album.albumName}</Text>
    <Text size="tiny" color="muted">{getShareProperties()}</Text>
  </div>
  <div class="flex">
    <IconButton
      aria-label={$t('view_qr_code')}
      shape="round"
      color="secondary"
      variant="ghost"
      icon={mdiQrcode}
      onclick={onViewQrCode}
    />
    <SharedLinkCopy link={sharedLink} />
  </div>
</div>
