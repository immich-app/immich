<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { type APIKeyResponseDto, type AuthDeviceResponseDto, oauth } from '@api';
  import SettingAccordion from '../admin-page/settings/setting-accordion.svelte';
  import ChangePasswordSettings from './change-password-settings.svelte';
  import DeviceList from './device-list.svelte';
  import LibraryList from './library-list.svelte';
  import MemoriesSettings from './memories-settings.svelte';
  import OAuthSettings from './oauth-settings.svelte';
  import PartnerSettings from './partner-settings.svelte';
  import SidebarSettings from './sidebar-settings.svelte';
  import UserAPIKeyList from './user-api-key-list.svelte';
  import UserProfileSettings from './user-profile-settings.svelte';
  import { user } from '$lib/stores/user.store';
  import { OpenSettingQueryParameterValue, QueryParameter } from '$lib/constants';
  import AppearanceSettings from './appearance-settings.svelte';
  import TrashSettings from './trash-settings.svelte';

  export let keys: APIKeyResponseDto[] = [];
  export let devices: AuthDeviceResponseDto[] = [];

  let oauthOpen = false;
  if (browser) {
    oauthOpen = oauth.isCallback(window.location);
  }
</script>

<SettingAccordion title="Thème" subtitle="Modifier l'apparance de Mémoire Vive">
  <AppearanceSettings />
</SettingAccordion>

<SettingAccordion title="Compte" subtitle="Modifier vos paramètres de compte">
  <UserProfileSettings user={$user} />
</SettingAccordion>

<SettingAccordion title="Clé API" subtitle="Paramètres des clés API">
  <UserAPIKeyList bind:keys />
</SettingAccordion>

<SettingAccordion title="Appareils autorisés" subtitle="Modifier vos appareils enregistrés">
  <DeviceList bind:devices />
</SettingAccordion>

<SettingAccordion title="Bibliothèques" subtitle="Modifier les paramètres des ressources">
  <LibraryList />
</SettingAccordion>

<SettingAccordion title="Memories" subtitle="Modifier ce que vous souhaitez voir">
  <MemoriesSettings user={$user} />
</SettingAccordion>

{#if $featureFlags.loaded && $featureFlags.oauth}
  <SettingAccordion
    title="OAuth"
    subtitle="Modifier votre connexion à OAuth"
    isOpen={oauthOpen ||
      $page.url.searchParams.get(QueryParameter.OPEN_SETTING) === OpenSettingQueryParameterValue.OAUTH}
  >
    <OAuthSettings user={$user} />
  </SettingAccordion>
{/if}

<SettingAccordion title="Mot de passe" subtitle="Modifier votre mot de passe">
  <ChangePasswordSettings />
</SettingAccordion>

<SettingAccordion title="Partage" subtitle="Modifier ce que peuvent voir vos partenaires">
  <PartnerSettings user={$user} />
</SettingAccordion>

<SettingAccordion title="Sidebar" subtitle="Modifier les menus de la sidebar">
  <SidebarSettings />
</SettingAccordion>

<SettingAccordion title="Corbeille" subtitle="Modifier les paramètres de la corbeille">
  <TrashSettings />
</SettingAccordion>
