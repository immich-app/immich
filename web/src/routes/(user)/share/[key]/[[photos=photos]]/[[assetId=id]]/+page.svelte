<script lang="ts">
  import AlbumViewer from '$lib/components/album-page/album-viewer.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import IndividualSharedViewer from '$lib/components/share-page/individual-shared-viewer.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import ImmichLogoSmallLink from '$lib/components/shared-components/immich-logo-small-link.svelte';
  import ThemeButton from '$lib/components/shared-components/theme-button.svelte';
  import { user } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import { getMySharedLink, SharedLinkType } from '@immich/sdk';
  import type { PageData } from './$types';
  import { setSharedLink } from '$lib/utils';
  import { t } from 'svelte-i18n';
  import { navigate } from '$lib/utils/navigation';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { tick } from 'svelte';

  export let data: PageData;

  let { gridScrollTarget } = assetViewingStore;
  let { sharedLink, passwordRequired, sharedLinkKey: key, meta } = data;
  let { title, description } = meta;
  let isOwned = $user ? $user.id === sharedLink?.userId : false;
  let password = '';
  let innerWidth: number;

  const handlePasswordSubmit = async () => {
    try {
      sharedLink = await getMySharedLink({ password, key });
      setSharedLink(sharedLink);
      passwordRequired = false;
      isOwned = $user ? $user.id === sharedLink.userId : false;
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
</script>

<svelte:window bind:innerWidth />

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
</svelte:head>
{#if passwordRequired}
  <header>
    <ControlAppBar showBackButton={false}>
      <svelte:fragment slot="leading">
        <ImmichLogoSmallLink width={innerWidth} />
      </svelte:fragment>

      <svelte:fragment slot="trailing">
        <ThemeButton />
      </svelte:fragment>
    </ControlAppBar>
  </header>
  <main
    class="relative h-screen overflow-hidden bg-immich-bg px-6 pt-[var(--navbar-height)] dark:bg-immich-dark-bg sm:px-12 md:px-24 lg:px-40"
  >
    <div class="flex flex-col items-center justify-center mt-20">
      <div class="text-2xl font-bold text-immich-primary dark:text-immich-dark-primary">{$t('password_required')}</div>
      <div class="mt-4 text-lg text-immich-primary dark:text-immich-dark-primary">
        {$t('sharing_enter_password')}
      </div>
      <div class="mt-4">
        <form novalidate autocomplete="off" on:submit|preventDefault={handlePasswordSubmit}>
          <input type="password" class="immich-form-input mr-2" placeholder={$t('password')} bind:value={password} />
          <Button type="submit">{$t('submit')}</Button>
        </form>
      </div>
    </div>
  </main>
{/if}

{#if !passwordRequired && sharedLink?.type == SharedLinkType.Album}
  <AlbumViewer {sharedLink} />
{/if}
{#if !passwordRequired && sharedLink?.type == SharedLinkType.Individual}
  <div class="immich-scrollbar">
    <IndividualSharedViewer {sharedLink} {isOwned} />
  </div>
{/if}
