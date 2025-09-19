<script lang="ts">
  import AlbumViewer from '$lib/components/album-page/album-viewer.svelte';
  import IndividualSharedViewer from '$lib/components/share-page/individual-shared-viewer.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import ImmichLogoSmallLink from '$lib/components/shared-components/immich-logo-small-link.svelte';
  import ThemeButton from '$lib/components/shared-components/theme-button.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { user } from '$lib/stores/user.store';
  import { setSharedLink } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { navigate } from '$lib/utils/navigation';
  import { getMySharedLink, SharedLinkType, type AssetResponseDto, type SharedLinkResponseDto } from '@immich/sdk';
  import { Button, PasswordInput } from '@immich/ui';
  import { tick } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    data: {
      meta: {
        title: string;
        description?: string;
        imageUrl?: string;
      };

      sharedLink?: SharedLinkResponseDto;
      key?: string;
      slug?: string;
      asset?: AssetResponseDto;
      passwordRequired?: boolean;
    };
  };

  const { data }: Props = $props();

  let { gridScrollTarget } = assetViewingStore;
  let { sharedLink, passwordRequired, key, slug, meta } = $state(data);
  let { title, description } = $state(meta);
  let isOwned = $derived($user ? $user.id === sharedLink?.userId : false);
  let password = $state('');

  const handlePasswordSubmit = async () => {
    try {
      sharedLink = await getMySharedLink({ password, key, slug });
      setSharedLink(sharedLink);
      passwordRequired = false;
      title = (sharedLink.album ? sharedLink.album.albumName : $t('public_share')) + ' - Immich';
      description =
        sharedLink.description ||
        $t('shared_photos_and_videos_count', { values: { assetCount: sharedLink.assets.length } });
      await tick();
      await navigate(
        { targetRoute: 'current', assetId: null, assetGridRouteSearchParams: $gridScrollTarget },
        { forceNavigate: true, replaceState: true },
      );
    } catch (error) {
      handleError(error, $t('errors.unable_to_get_shared_link'));
    }
  };

  const onsubmit = async (event: Event) => {
    event.preventDefault();
    await handlePasswordSubmit();
  };
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
</svelte:head>
{#if passwordRequired}
  <main
    class="relative h-dvh overflow-hidden px-6 max-md:pt-(--navbar-height-md) pt-(--navbar-height) sm:px-12 md:px-24 lg:px-40"
  >
    <div class="flex flex-col items-center justify-center mt-20">
      <div class="text-2xl font-bold text-primary">{$t('password_required')}</div>
      <div class="mt-4 text-lg text-primary">
        {$t('sharing_enter_password')}
      </div>
      <div class="mt-4">
        <form class="flex gap-x-2" novalidate {onsubmit}>
          <PasswordInput autocomplete="off" bind:value={password} placeholder="Password" />
          <Button type="submit">{$t('submit')}</Button>
        </form>
      </div>
    </div>
  </main>
  <header>
    <ControlAppBar showBackButton={false}>
      {#snippet leading()}
        <ImmichLogoSmallLink />
      {/snippet}

      {#snippet trailing()}
        <ThemeButton />
      {/snippet}
    </ControlAppBar>
  </header>
{/if}

{#if !passwordRequired && sharedLink?.type == SharedLinkType.Album}
  <AlbumViewer {sharedLink} />
{/if}
{#if !passwordRequired && sharedLink?.type == SharedLinkType.Individual}
  <div class="immich-scrollbar">
    <IndividualSharedViewer {sharedLink} {isOwned} />
  </div>
{/if}
