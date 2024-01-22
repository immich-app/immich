<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handleError } from '$lib/utils/handle-error';
  import { AllJobStatusResponseDto, api, JobCommand, JobCommandDto, JobName } from '@api';
  import type { ComponentType } from 'svelte';
  import {
    mdiFaceRecognition,
    mdiFileJpgBox,
    mdiFileXmlBox,
    mdiFolderMove,
    mdiImageSearch,
    mdiLibraryShelves,
    mdiTable,
    mdiVideo,
  } from '@mdi/js';
  import ConfirmDialogue from '../../shared-components/confirm-dialogue.svelte';
  import JobTile from './job-tile.svelte';
  import StorageMigrationDescription from './storage-migration-description.svelte';

  export let jobs: AllJobStatusResponseDto;

  interface JobDetails {
    title: string;
    subtitle?: string;
    allText?: string;
    missingText?: string;
    disabled?: boolean;
    icon: string;
    allowForceCommand?: boolean;
    component?: ComponentType;
    handleCommand?: (jobId: JobName, jobCommand: JobCommandDto) => Promise<void>;
  }

  let faceConfirm = false;

  const handleFaceCommand = async (jobId: JobName, dto: JobCommandDto) => {
    if (dto.force) {
      faceConfirm = true;
      return;
    }

    await handleCommand(jobId, dto);
  };

  const onFaceConfirm = () => {
    faceConfirm = false;
    handleCommand(JobName.RecognizeFaces, { command: JobCommand.Start, force: true });
  };

    $: jobDetails = <Partial<Record<JobName, JobDetails>>>{
    [JobName.ThumbnailGeneration]: {
      icon: mdiFileJpgBox,
      title: api.getJobName(JobName.ThumbnailGeneration),
      subtitle: 'Générer des miniatures grandes, petites et floues pour chaque actif, ainsi que des miniatures pour chaque personne',
    },
    [JobName.MetadataExtraction]: {
      icon: mdiTable,
      title: api.getJobName(JobName.MetadataExtraction),
      subtitle: 'Extraire les informations de métadonnées de chaque actif, telles que le GPS et la résolution',
    },
    [JobName.Library]: {
      icon: mdiLibraryShelves,
      title: api.getJobName(JobName.Library),
      subtitle: 'Effectuer des tâches de bibliothèque',
      allText: 'TOUT',
      missingText: 'ACTUALISER',
    },
    [JobName.Sidecar]: {
      title: api.getJobName(JobName.Sidecar),
      icon: mdiFileXmlBox,
      subtitle: 'Découvrir ou synchroniser les métadonnées sidecar depuis le système de fichiers',
      allText: 'SYNC',
      missingText: 'DÉCOUVRIR',
      disabled: !$featureFlags.sidecar,
    },
    [JobName.SmartSearch]: {
      icon: mdiImageSearch,
      title: api.getJobName(JobName.SmartSearch),
      subtitle: 'Exécuter l\'apprentissage automatique sur les actifs pour supporter la recherche intelligente',
      disabled: !$featureFlags.clipEncode,
    },
    [JobName.RecognizeFaces]: {
      icon: mdiFaceRecognition,
<<<<<<< Updated upstream
      title: api.getJobName(JobName.RecognizeFaces),
      subtitle: 'Run machine learning on assets to recognize faces',
      handleCommand: handleFaceCommand,
=======
      title: api.getJobName(JobName.FaceDetection),
      subtitle:
        'Détecter les visages dans les actifs en utilisant l\'apprentissage automatique. Pour les vidéos, seul le vignette est considérée. "Tout" (re-)traite tous les actifs. "Manquant" met en file d\'attente les actifs qui n\'ont pas encore été traités. Les visages détectés seront mis en file d\'attente pour la reconnaissance faciale après la détection de visage, les regroupant en personnes existantes ou nouvelles.',
      handleCommand: handleConfirmCommand,
      disabled: !$featureFlags.facialRecognition,
    },
    [JobName.FacialRecognition]: {
      icon: mdiTagFaces,
      title: api.getJobName(JobName.FacialRecognition),
      subtitle:
        'Regrouper les visages détectés en personnes. Cette étape s\'exécute après la détection de visage. "Tout" (re-)groupe tous les visages. "Manquant" met en file d\'attente les visages qui n\'ont pas de personne assignée.',
      handleCommand: handleConfirmCommand,
>>>>>>> Stashed changes
      disabled: !$featureFlags.facialRecognition,
    },
    [JobName.VideoConversion]: {
      icon: mdiVideo,
      title: api.getJobName(JobName.VideoConversion),
      subtitle: 'Transcoder les vidéos pour une meilleure compatibilité avec les navigateurs et les appareils',
    },
    [JobName.StorageTemplateMigration]: {
      icon: mdiFolderMove,
      title: api.getJobName(JobName.StorageTemplateMigration),
      allowForceCommand: false,
      component: StorageMigrationDescription,
    },
    [JobName.Migration]: {
      icon: mdiFolderMove,
      title: api.getJobName(JobName.Migration),
      subtitle: 'Migrer les miniatures pour les actifs et les visages vers la dernière structure de dossiers',
      allowForceCommand: false,
    },
  };
  $: jobList = Object.entries(jobDetails) as [JobName, JobDetails][];
  
  async function handleCommand(jobId: JobName, jobCommand: JobCommandDto) {
    const title = jobDetails[jobId]?.title;
  
    try {
      const { data } = await api.jobApi.sendJobCommand({ id: jobId, jobCommandDto: jobCommand });
      jobs[jobId] = data;
    
      switch (jobCommand.command) {
        case JobCommand.Empty:
          notificationController.show({
            message: `Tâches effacées pour : ${title}`,
            type: NotificationType.Info,
          });
          break;
      }
    } catch (error) {
      handleError(error, `La commande '${jobCommand.command}' a échoué pour la tâche : ${title}`);
    }
  }
</script>

<<<<<<< Updated upstream
{#if faceConfirm}
  <ConfirmDialogue
    prompt="Are you sure you want to reprocess all faces? This will also clear named people."
    on:confirm={onFaceConfirm}
    on:cancel={() => (faceConfirm = false)}
=======

{#if confirmJob}
  <ConfirmDialogue
    prompt="Êtes-vous sûr de vouloir recommencer le travail d'IA facial ? Cela supprimera les noms existants"
    on:confirm={onConfirm}
    on:cancel={() => (confirmJob = null)}
>>>>>>> Stashed changes
  />
{/if}

<div class="flex flex-col gap-7">
  {#each jobList as [jobName, { title, subtitle, disabled, allText, missingText, allowForceCommand, icon, component, handleCommand: handleCommandOverride }]}
    {@const { jobCounts, queueStatus } = jobs[jobName]}
    <JobTile
      {icon}
      {title}
      {disabled}
      {subtitle}
      allText={allText || 'TOUT'}
      missingText={missingText || 'MANQUANT'}
      {allowForceCommand}
      {jobCounts}
      {queueStatus}
      on:command={({ detail }) => (handleCommandOverride || handleCommand)(jobName, detail)}
    >
      {#if component}
        <svelte:component this={component} slot="description" />
      {/if}
    </JobTile>
  {/each}
</div>
