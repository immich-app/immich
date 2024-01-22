<script lang="ts">
  import { page } from '$app/stores';
  import FFmpegSettings from '$lib/components/admin-page/settings/ffmpeg/ffmpeg-settings.svelte';
  import JobSettings from '$lib/components/admin-page/settings/job-settings/job-settings.svelte';
  import MachineLearningSettings from '$lib/components/admin-page/settings/machine-learning-settings/machine-learning-settings.svelte';
  import MapSettings from '$lib/components/admin-page/settings/map-settings/map-settings.svelte';
  import OAuthSettings from '$lib/components/admin-page/settings/oauth/oauth-settings.svelte';
  import PasswordLoginSettings from '$lib/components/admin-page/settings/password-login/password-login-settings.svelte';
  import SettingAccordion from '$lib/components/admin-page/settings/setting-accordion.svelte';
  import StorageTemplateSettings from '$lib/components/admin-page/settings/storage-template/storage-template-settings.svelte';
  import ThumbnailSettings from '$lib/components/admin-page/settings/thumbnail/thumbnail-settings.svelte';
  import ServerSettings from '$lib/components/admin-page/settings/server/server-settings.svelte';
  import TrashSettings from '$lib/components/admin-page/settings/trash-settings/trash-settings.svelte';
  import ThemeSettings from '$lib/components/admin-page/settings/theme/theme-settings.svelte';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { downloadManager } from '$lib/stores/download';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { downloadBlob } from '$lib/utils/asset-utils';
  import { type SystemConfigDto, copyToClipboard } from '@api';
  import Icon from '$lib/components/elements/icon.svelte';
  import type { PageData } from './$types';
  import NewVersionCheckSettings from '$lib/components/admin-page/settings/new-version-check-settings/new-version-check-settings.svelte';
  import LibrarySettings from '$lib/components/admin-page/settings/library-settings/library-settings.svelte';
  import LoggingSettings from '$lib/components/admin-page/settings/logging-settings/logging-settings.svelte';
  import { mdiAlert, mdiContentCopy, mdiDownload } from '@mdi/js';
  import _ from 'lodash';
  import AdminSettings from '$lib/components/admin-page/settings/admin-settings.svelte';

  export let data: PageData;

  let config = data.configs;
  let openSettings = ($page.url.searchParams.get('open')?.split(',') || []) as Array<keyof SystemConfigDto>;

  const downloadConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const downloadKey = 'memoirevive-config.json';
    downloadManager.add(downloadKey, blob.size);
    downloadManager.update(downloadKey, blob.size);
    downloadBlob(blob, downloadKey);
    setTimeout(() => downloadManager.clear(downloadKey), 5_000);
  };

  const settings = [
  {
    item: JobSettings,
    title: 'Paramètres des Tâches',
    subtitle: 'Gérer la concurrence des tâches',
    isOpen: openSettings.includes('job'),
  },
  {
    item: LibrarySettings,
    title: 'Bibliothèque',
    subtitle: 'Gérer les paramètres de la bibliothèque',
    isOpen: openSettings.includes('library'),
  },
  {
    item: LoggingSettings,
    title: 'Journalisation',
    subtitle: 'Gérer les paramètres de journalisation',
    isOpen: openSettings.includes('logging'),
  },
  {
    item: MachineLearningSettings,
    title: 'Paramètres d\'Apprentissage Automatique',
    subtitle: 'Gérer les fonctionnalités et paramètres d\'apprentissage automatique',
    isOpen: openSettings.includes('machineLearning'),
  },
  {
    item: MapSettings,
    title: 'Paramètres de Carte & GPS',
    subtitle: 'Gérer les fonctionnalités et paramètres liés à la carte',
    isOpen: openSettings.some((key) => ['map', 'reverseGeocoding'].includes(key)),
  },
  {
    item: OAuthSettings,
    title: 'Authentification OAuth',
    subtitle: 'Gérer les paramètres de connexion avec OAuth',
    isOpen: openSettings.includes('oauth'),
  },
  {
    item: PasswordLoginSettings,
    title: 'Authentification par Mot de Passe',
    subtitle: 'Gérer les paramètres de connexion avec mot de passe',
    isOpen: openSettings.includes('passwordLogin'),
  },
  {
    item: ServerSettings,
    title: 'Paramètres du Serveur',
    subtitle: 'Gérer les paramètres du serveur',
    isOpen: openSettings.includes('server'),
  },
  {
    item: StorageTemplateSettings,
    title: 'Modèle de Stockage',
    subtitle: 'Gérer la structure de dossiers et le nom de fichier des actifs téléchargés',
    isOpen: openSettings.includes('storageTemplate'),
  },
  {
    item: ThemeSettings,
    title: 'Paramètres du Thème',
    subtitle: 'Gérer la personnalisation de l\'interface web Immich',
    isOpen: openSettings.includes('theme'),
  },
  {
    item: ThumbnailSettings,
    title: 'Paramètres des Miniatures',
    subtitle: 'Gérer la résolution des tailles de miniatures',
    isOpen: openSettings.includes('thumbnail'),
  },
  {
    item: TrashSettings,
    title: 'Paramètres de la Corbeille',
    subtitle: 'Gérer les paramètres de la corbeille',
    isOpen: openSettings.includes('trash'),
  },
  {
    item: NewVersionCheckSettings,
    title: 'Vérification de Version',
    subtitle: 'Activer/désactiver la notification de nouvelle version',
    isOpen: openSettings.includes('newVersionCheck'),
  },
  {
    item: FFmpegSettings,
    title: 'Paramètres de Transcodage Vidéo',
    subtitle: 'Gérer la résolution et les informations d\'encodage des fichiers vidéo',
    isOpen: openSettings.includes('ffmpeg'),
  },
];
</script>

{#if $featureFlags.configFile}
  <div class="mb-8 flex flex-row items-center gap-2 rounded-md bg-gray-100 p-3 dark:bg-gray-800">
    <Icon path={mdiAlert} class="text-yellow-400" size={18} />
    <h2 class="text-md text-immich-primary dark:text-immich-dark-primary">La configuration est actuellement définie par un fichier de configuration</h2>
  </div>
{/if}

<UserPageLayout title={data.meta.title} admin>
  <div class="flex justify-end gap-2" slot="buttons">
    <LinkButton on:click={() => copyToClipboard(JSON.stringify(config, null, 2))}>
      <div class="flex place-items-center gap-2 text-sm">
        <Icon path={mdiContentCopy} size="18" />
        Copier dans le presse-papier
      </div>
    </LinkButton>
    <LinkButton on:click={() => downloadConfig()}>
      <div class="flex place-items-center gap-2 text-sm">
        <Icon path={mdiDownload} size="18" />
        Exporter au format JSON
      </div>
    </LinkButton>
  </div>

  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-[850px]">
      <!-- Les titres et sous-titres des accordéons ci-dessous ont été traduits en français -->
      <SettingAccordion
        title="Paramètres des Tâches"
        subtitle="Gérer la concurrence des tâches"
        isOpen={$page.url.searchParams.get('open') === 'job-settings'}
      >
        <JobSettings disabled={$featureFlags.configFile} jobConfig={configs.job} />
      </SettingAccordion>

      <SettingAccordion title="Bibliothèque" subtitle="Gérer les paramètres de la bibliothèque">
        <LibrarySettings disabled={$featureFlags.configFile} libraryConfig={configs.library} />
      </SettingAccordion>

      <SettingAccordion title="Journalisation" subtitle="Gérer les paramètres de journalisation">
        <LoggingSettings disabled={$featureFlags.configFile} loggingConfig={configs.logging} />
      </SettingAccordion>

      <SettingAccordion title="Paramètres d'Apprentissage Automatique" subtitle="Gérer les fonctionnalités et paramètres d'apprentissage automatique">
        <MachineLearningSettings disabled={$featureFlags.configFile} machineLearningConfig={configs.machineLearning} />
      </SettingAccordion>

      <SettingAccordion title="Paramètres de Carte & GPS" subtitle="Gérer les fonctionnalités et paramètres liés à la carte">
        <MapSettings disabled={$featureFlags.configFile} config={configs} />
      </SettingAccordion>

      <SettingAccordion title="Authentification OAuth" subtitle="Gérer les paramètres de connexion avec OAuth">
        <OAuthSettings disabled={$featureFlags.configFile} oauthConfig={configs.oauth} />
      </SettingAccordion>

      <SettingAccordion title="Authentification par Mot de Passe" subtitle="Gérer les paramètres de connexion avec mot de passe">
        <PasswordLoginSettings disabled={$featureFlags.configFile} passwordLoginConfig={configs.passwordLogin} />
      </SettingAccordion>

      <SettingAccordion title="Paramètres du Serveur" subtitle="Gérer les paramètres du serveur">
        <ServerSettings disabled={$featureFlags.configFile} serverConfig={configs.server} />
      </SettingAccordion>

      <SettingAccordion
        title="Modèle de Stockage"
        subtitle="Gérer la structure de dossiers et le nom de fichier des actifs téléchargés"
        isOpen={$page.url.searchParams.get('open') === 'storage-template'}
      >
        <StorageTemplateSettings disabled={$featureFlags.configFile} storageConfig={configs.storageTemplate} />
      </SettingAccordion>

      <SettingAccordion title="Paramètres du Thème" subtitle="Gérer la personnalisation de l'interface web Immich">
        <ThemeSettings disabled={$featureFlags.configFile} themeConfig={configs.theme} />
      </SettingAccordion>

      <SettingAccordion title="Paramètres des Miniatures" subtitle="Gérer la résolution des tailles de miniatures">
        <ThumbnailSettings disabled={$featureFlags.configFile} thumbnailConfig={configs.thumbnail} />
      </SettingAccordion>

      <SettingAccordion title="Paramètres de la Corbeille" subtitle="Gérer les paramètres de la corbeille">
        <TrashSettings disabled={$featureFlags.configFile} trashConfig={configs.trash} />
      </SettingAccordion>

      <SettingAccordion title="Vérification de Version" subtitle="Activer/désactiver la notification de nouvelle version">
        <NewVersionCheckSettings disabled={$featureFlags.configFile} newVersionCheckConfig={configs.newVersionCheck} />
      </SettingAccordion>

      <SettingAccordion
        title="Paramètres de Transcodage Vidéo"
        subtitle="Gérer la résolution et les informations d'encodage des fichiers vidéo"
      >
        <FFmpegSettings disabled={$featureFlags.configFile} ffmpegConfig={configs.ffmpeg} />
      </SettingAccordion>
    </section>
  </AdminSettings>
</UserPageLayout>
