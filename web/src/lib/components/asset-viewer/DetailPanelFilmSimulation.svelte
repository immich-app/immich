<script lang="ts">
  import ClassicChromeBanner from '$lib/components/asset-viewer/ClassicChromeBanner.svelte';
  import DetailPanelDevelopSlider from '$lib/components/asset-viewer/DetailPanelDevelopSlider.svelte';
  import FujifilmFilmSimulationBanner from '$lib/components/asset-viewer/FujifilmFilmSimulationBanner.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { waitForWebsocketEvent } from '$lib/stores/websocket';
  import {
    createFujiDevelopParameters,
    defaultFujiDevelopSettings,
    findFujiDevelopEdit,
    FUJI_DEVELOP_CONTROL_CONFIG,
    FUJI_DEVELOP_READY_TIMEOUT_MS,
    fujiDevelopSignature,
    getAsShotFujiProfileSlug,
    isFujiDevelopParameters,
    isFujiXt5RawAsset,
    mergeFujiDevelopEdit,
    type FujiDevelopParameters,
    type FujiDevelopSettings,
    type StoredAssetEdit,
  } from '$lib/utils/fuji-develop';
  import {
    FUJI_FILM_SIMULATIONS,
    getFilmSimulationBySlug,
    getFilmSimulationGraphic,
    type FujiFilmSimulationSlug,
  } from '$lib/utils/film-simulation';
  import { filmSimulationBannerConfigs } from '$lib/utils/film-simulation-banner';
  import { handleError } from '$lib/utils/handle-error';
  import {
    editAsset,
    getAssetEdits,
    getAssetInfo,
    type AssetEditsCreateDto,
    type AssetResponseDto,
  } from '@immich/sdk';
  import { toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    filmMode: string;
    asset?: AssetResponseDto;
    isOwner?: boolean;
  }

  type RenderState = 'idle' | 'rendering' | 'pending' | 'ready' | 'error';

  let { filmMode, asset, isOwner = false }: Props = $props();
  let selectorOpen = $state(false);
  let levelsOpen = $state(false);
  let isLoading = $state(false);
  let activeApply = $state<{ assetId: string; sequence: number }>();
  let loadError = $state('');
  let applyError = $state('');
  let renderState = $state<RenderState>('idle');
  let storedEdits = $state<StoredAssetEdit[]>([]);
  let settings = $state<FujiDevelopSettings>(defaultFujiDevelopSettings());
  let profileSlug = $state<FujiFilmSimulationSlug>(getAsShotFujiProfileSlug(filmMode));
  let savedSignature = $state<string>();
  let loadSequence = 0;
  let applySequence = 0;

  let canEdit = $derived(Boolean(asset && isOwner && !asset.isOffline && isFujiXt5RawAsset(asset)));
  let isApplying = $derived(Boolean(asset?.id && activeApply?.assetId === asset.id));
  let selectedGraphic = $derived(getFilmSimulationBySlug(profileSlug));
  let graphic = $derived(canEdit ? selectedGraphic : getFilmSimulationGraphic(filmMode));
  let displayTitle = $derived(canEdit ? selectedGraphic.label : filmMode);
  let isClassicChrome = $derived(graphic?.slug === 'classic-chrome');
  let bannerConfig = $derived(graphic?.banner ? filmSimulationBannerConfigs[graphic.banner] : undefined);
  let isVectorBanner = $derived(isClassicChrome || Boolean(bannerConfig));
  let draftParameters = $derived(createFujiDevelopParameters(profileSlug, settings));
  let controlsDisabled = $derived(isLoading || isApplying || Boolean(loadError));
  let hasUnsavedChanges = $derived(
    !isLoading && (savedSignature === undefined || savedSignature !== fujiDevelopSignature(draftParameters)),
  );

  const toStoredEdits = (edits: Array<{ id?: string; action: unknown; parameters: unknown }>): StoredAssetEdit[] =>
    edits
      .filter(
        (edit): edit is { id?: string; action: string; parameters: Record<string, unknown> } =>
          typeof edit.action === 'string' && Boolean(edit.parameters) && typeof edit.parameters === 'object',
      )
      .map(({ id, action, parameters }) => ({ id, action, parameters }));

  const settingsFromParameters = (parameters: FujiDevelopParameters): FujiDevelopSettings => ({
    exposure: parameters.exposure,
    contrast: parameters.contrast,
    highlights: parameters.highlights,
    shadows: parameters.shadows,
    whites: parameters.whites,
    blacks: parameters.blacks,
    temperature: parameters.temperature,
    tint: parameters.tint,
    vibrance: parameters.vibrance,
    saturation: parameters.saturation,
  });

  const loadEdits = async (assetId: string, asShotSlug: FujiFilmSimulationSlug, sequence: number) => {
    isLoading = true;
    loadError = '';
    applyError = '';
    selectorOpen = false;
    renderState = 'idle';

    try {
      const response = await getAssetEdits({ id: assetId });
      if (sequence !== loadSequence) {
        return;
      }

      const edits = toStoredEdits(response.edits as Array<{ id?: string; action: unknown; parameters: unknown }>);
      const developEdit = findFujiDevelopEdit(edits);
      storedEdits = edits;
      profileSlug = developEdit?.parameters.profileSlug ?? asShotSlug;
      settings = developEdit ? settingsFromParameters(developEdit.parameters) : defaultFujiDevelopSettings();
      savedSignature = developEdit ? fujiDevelopSignature(developEdit.parameters) : undefined;
      renderState = developEdit ? 'ready' : 'idle';
    } catch (error) {
      if (sequence === loadSequence) {
        loadError = handleError(error, $t('fuji_develop_load_error'), { notify: false }) ?? $t('fuji_develop_load_error');
        storedEdits = [];
        profileSlug = asShotSlug;
        settings = defaultFujiDevelopSettings();
        savedSignature = undefined;
      }
    } finally {
      if (sequence === loadSequence) {
        isLoading = false;
      }
    }
  };

  $effect(() => {
    const assetId = canEdit ? asset?.id : undefined;
    const asShotSlug = getAsShotFujiProfileSlug(filmMode);
    const sequence = ++loadSequence;

    if (!assetId) {
      storedEdits = [];
      profileSlug = asShotSlug;
      settings = defaultFujiDevelopSettings();
      savedSignature = undefined;
      isLoading = false;
      return;
    }

    void loadEdits(assetId, asShotSlug, sequence);
    return () => {
      if (loadSequence === sequence) {
        loadSequence++;
      }
    };
  });

  const saveParameters = async (parameters: FujiDevelopParameters) => {
    if (!asset || !canEdit || isApplying || isLoading || loadError) {
      return;
    }

    if (!isFujiDevelopParameters(parameters)) {
      renderState = 'error';
      applyError = $t('fuji_develop_invalid_settings');
      toastManager.danger(applyError);
      return;
    }

    const sourceAsset = asset;
    const assetId = sourceAsset.id;
    const sequence = ++applySequence;
    const mergedEdits = mergeFujiDevelopEdit(storedEdits, parameters);
    const requestedSignature = fujiDevelopSignature(parameters);
    activeApply = { assetId, sequence };
    applyError = '';
    renderState = 'rendering';

    try {
      const editCompleted = waitForWebsocketEvent(
        'AssetEditReadyV2',
        (event) => {
          if (event.asset.id !== assetId) {
            return false;
          }
          const completedEdits = toStoredEdits(
            event.edit as unknown as Array<{ id?: string; action: unknown; parameters: unknown }>,
          );
          const completedDevelopEdit = findFujiDevelopEdit(completedEdits);
          return completedDevelopEdit ? fujiDevelopSignature(completedDevelopEdit.parameters) === requestedSignature : false;
        },
        FUJI_DEVELOP_READY_TIMEOUT_MS,
      );

      const [, [completedEvent]] = await Promise.all([
        editAsset({
          id: assetId,
          assetEditsCreateDto: { edits: mergedEdits } as unknown as AssetEditsCreateDto,
        }),
        editCompleted,
      ]);

      eventManager.emit('AssetEditsApplied', assetId);

      if (asset?.id === assetId && activeApply?.sequence === sequence) {
        storedEdits = mergedEdits;
        savedSignature = requestedSignature;
        renderState = 'ready';
        toastManager.primary($t('fuji_develop_success'));
      }

      eventManager.emit('AssetUpdate', {
        ...sourceAsset,
        thumbhash: completedEvent.asset.thumbhash,
        width: completedEvent.asset.width,
        height: completedEvent.asset.height,
        isEdited: completedEvent.asset.isEdited,
        // The matched completion proves new bytes are published. Use a fresh
        // client cache token immediately; the canonical server value follows.
        updatedAt: new Date().toISOString(),
      });
      void getAssetInfo({ id: assetId })
        .then((refreshedAsset) => eventManager.emit('AssetUpdate', refreshedAsset))
        .catch(() => undefined);
    } catch (error) {
      if (asset?.id !== assetId || activeApply?.sequence !== sequence) {
        return;
      }

      if (error instanceof Error && error.message.startsWith('Timeout waiting for event:')) {
        renderState = 'pending';
        applyError = $t('fuji_develop_pending');
        toastManager.info(applyError);
      } else {
        renderState = 'error';
        applyError = handleError(error, $t('fuji_develop_apply_error')) ?? $t('fuji_develop_apply_error');
      }
    } finally {
      if (activeApply?.sequence === sequence) {
        activeApply = undefined;
      }
    }
  };

  const applyDevelop = () => saveParameters(draftParameters);

  const selectProfile = async (slug: FujiFilmSimulationSlug) => {
    profileSlug = slug;
    selectorOpen = false;
    const parameters = createFujiDevelopParameters(slug, settings);
    if (savedSignature !== fujiDevelopSignature(parameters)) {
      await saveParameters(parameters);
    }
  };

  const resetDevelop = async () => {
    const resetSettings = defaultFujiDevelopSettings();
    const resetProfile = getAsShotFujiProfileSlug(filmMode);
    settings = resetSettings;
    profileSlug = resetProfile;
    selectorOpen = false;
    await saveParameters(createFujiDevelopParameters(resetProfile, resetSettings));
  };

  const setNullableSetting = (name: 'temperature' | 'tint', value: string) => {
    const numericValue = Number(value);
    const config = FUJI_DEVELOP_CONTROL_CONFIG[name];
    settings[name] =
      value === '' || !Number.isFinite(numericValue)
        ? null
        : Math.min(config.maximum, Math.max(config.minimum, numericValue));
  };
</script>

{#snippet simulationGraphic()}
  {#if isClassicChrome}
    <ClassicChromeBanner title={displayTitle} />
  {:else if bannerConfig && graphic}
    <FujifilmFilmSimulationBanner config={bannerConfig} title={displayTitle} displayLabel={graphic.label} />
  {:else if graphic}
    <img
      src={graphic.src}
      alt={`${graphic.label} film simulation`}
      title={displayTitle}
      class="block aspect-square w-full rounded-2xl border border-black/10 object-cover shadow-sm dark:border-white/10"
      draggable="false"
    />
  {:else}
    <div
      class="flex min-h-32 w-full flex-col justify-end rounded-2xl border border-black/10 bg-linear-to-br from-neutral-100 to-neutral-300 p-5 shadow-sm dark:border-white/10 dark:from-neutral-700 dark:to-neutral-950"
    >
      <p class="text-xs font-semibold tracking-[0.2em] text-immich-fg/60 uppercase dark:text-immich-dark-fg/60">
        {$t('fuji_develop_film_simulation')}
      </p>
      <p class="mt-1 text-xl font-medium text-immich-fg dark:text-immich-dark-fg">{displayTitle}</p>
    </div>
  {/if}
{/snippet}

<div data-testid={canEdit ? 'fuji-raw-editor' : undefined}>
  <figure
    class={isVectorBanner ? '-mx-6 w-[calc(100%+3rem)] py-4' : 'w-full py-4'}
    data-testid="film-simulation-graphic"
  >
    {#if canEdit}
      <button
        type="button"
        class="block w-full cursor-pointer rounded-2xl text-start outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
        aria-label={$t('fuji_develop_change_simulation')}
        aria-expanded={selectorOpen}
        onclick={() => (selectorOpen = !selectorOpen)}
        disabled={controlsDisabled}
      >
        {@render simulationGraphic()}
      </button>
    {:else}
      {@render simulationGraphic()}
    {/if}
  </figure>

  {#if canEdit}
    <div class="pb-5">
      <div class="mb-2 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-immich-fg dark:text-immich-dark-fg">{selectedGraphic.label}</p>
          <p class="truncate text-xs text-immich-fg/60 dark:text-immich-dark-fg/60">
            {$t('fuji_develop_as_shot', { values: { simulation: getFilmSimulationBySlug(getAsShotFujiProfileSlug(filmMode)).label } })}
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-immich-primary/10 disabled:opacity-50 dark:border-white/10 dark:hover:bg-immich-dark-primary/20"
          onclick={() => (selectorOpen = !selectorOpen)}
          disabled={controlsDisabled}
        >
          {$t('fuji_develop_choose')}
        </button>
      </div>

      {#if selectorOpen}
        <div
          class="mb-3 max-h-64 overflow-y-auto rounded-xl border border-black/10 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-immich-dark-bg"
          data-testid="film-simulation-selector"
        >
          {#each FUJI_FILM_SIMULATIONS as simulation (simulation.slug)}
            <button
              type="button"
              class={[
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-sm hover:bg-immich-primary/10 disabled:opacity-50 dark:hover:bg-immich-dark-primary/20',
                { 'bg-immich-primary/10 dark:bg-immich-dark-primary/20': profileSlug === simulation.slug },
              ]}
              aria-pressed={profileSlug === simulation.slug}
              onclick={() => selectProfile(simulation.slug)}
              disabled={controlsDisabled}
            >
              <span>{simulation.label}</span>
              {#if profileSlug === simulation.slug}
                <span aria-hidden="true" class="text-primary">✓</span>
              {/if}
            </button>
          {/each}
        </div>
      {/if}

      <details
        class="rounded-xl border border-black/10 dark:border-white/10"
        bind:open={levelsOpen}
        data-testid="fuji-develop-levels"
      >
        <summary
          class="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-medium [&::-webkit-details-marker]:hidden"
        >
          <span>{$t('fuji_develop_levels')}</span>
          <span aria-hidden="true" class="text-xs text-immich-fg/60 dark:text-immich-dark-fg/60">{levelsOpen ? '−' : '+'}</span>
        </summary>
        <div class="border-t border-black/10 px-3 py-3 dark:border-white/10">
          <DetailPanelDevelopSlider
            id="fuji-exposure"
            label={$t('fuji_develop_exposure')}
            minimum={FUJI_DEVELOP_CONTROL_CONFIG.exposure.minimum}
            maximum={FUJI_DEVELOP_CONTROL_CONFIG.exposure.maximum}
            step={FUJI_DEVELOP_CONTROL_CONFIG.exposure.step}
            bind:value={settings.exposure}
            disabled={controlsDisabled}
          />
          <DetailPanelDevelopSlider
            id="fuji-contrast"
            label={$t('fuji_develop_contrast')}
            minimum={FUJI_DEVELOP_CONTROL_CONFIG.contrast.minimum}
            maximum={FUJI_DEVELOP_CONTROL_CONFIG.contrast.maximum}
            step={FUJI_DEVELOP_CONTROL_CONFIG.contrast.step}
            bind:value={settings.contrast}
            disabled={controlsDisabled}
          />
          <DetailPanelDevelopSlider
            id="fuji-highlights"
            label={$t('fuji_develop_highlights')}
            minimum={FUJI_DEVELOP_CONTROL_CONFIG.highlights.minimum}
            maximum={FUJI_DEVELOP_CONTROL_CONFIG.highlights.maximum}
            step={FUJI_DEVELOP_CONTROL_CONFIG.highlights.step}
            bind:value={settings.highlights}
            disabled={controlsDisabled}
          />
          <DetailPanelDevelopSlider
            id="fuji-shadows"
            label={$t('fuji_develop_shadows')}
            minimum={FUJI_DEVELOP_CONTROL_CONFIG.shadows.minimum}
            maximum={FUJI_DEVELOP_CONTROL_CONFIG.shadows.maximum}
            step={FUJI_DEVELOP_CONTROL_CONFIG.shadows.step}
            bind:value={settings.shadows}
            disabled={controlsDisabled}
          />
          <DetailPanelDevelopSlider
            id="fuji-whites"
            label={$t('fuji_develop_whites')}
            minimum={FUJI_DEVELOP_CONTROL_CONFIG.whites.minimum}
            maximum={FUJI_DEVELOP_CONTROL_CONFIG.whites.maximum}
            step={FUJI_DEVELOP_CONTROL_CONFIG.whites.step}
            bind:value={settings.whites}
            disabled={controlsDisabled}
          />
          <DetailPanelDevelopSlider
            id="fuji-blacks"
            label={$t('fuji_develop_blacks')}
            minimum={FUJI_DEVELOP_CONTROL_CONFIG.blacks.minimum}
            maximum={FUJI_DEVELOP_CONTROL_CONFIG.blacks.maximum}
            step={FUJI_DEVELOP_CONTROL_CONFIG.blacks.step}
            bind:value={settings.blacks}
            disabled={controlsDisabled}
          />

          <div class="my-2 border-t border-black/5 dark:border-white/5"></div>

          <div class="grid min-h-9 grid-cols-[4.5rem_minmax(0,1fr)_3.75rem] items-center gap-2">
            <label for="fuji-temperature" class="text-xs text-immich-fg/75 dark:text-immich-dark-fg/75">
              {$t('fuji_develop_temperature')}
            </label>
            <input
              id="fuji-temperature"
              type="range"
              min={FUJI_DEVELOP_CONTROL_CONFIG.temperature.minimum}
              max={FUJI_DEVELOP_CONTROL_CONFIG.temperature.maximum}
              step={FUJI_DEVELOP_CONTROL_CONFIG.temperature.step}
              value={settings.temperature ?? 6500}
              oninput={(event) => (settings.temperature = Number(event.currentTarget.value))}
              disabled={controlsDisabled}
              class="min-w-0 accent-primary"
            />
            <input
              aria-label={$t('fuji_develop_temperature_value')}
              type="number"
              min={FUJI_DEVELOP_CONTROL_CONFIG.temperature.minimum}
              max={FUJI_DEVELOP_CONTROL_CONFIG.temperature.maximum}
              step={FUJI_DEVELOP_CONTROL_CONFIG.temperature.step}
              value={settings.temperature ?? ''}
              placeholder={$t('fuji_develop_as_shot_short')}
              onchange={(event) => setNullableSetting('temperature', event.currentTarget.value)}
              disabled={controlsDisabled}
              class="h-7 w-15 rounded-md border border-black/10 bg-gray-100 px-1.5 text-right text-xs tabular-nums outline-hidden focus:border-primary dark:border-white/10 dark:bg-gray-800"
            />
          </div>
          <div class="grid min-h-9 grid-cols-[4.5rem_minmax(0,1fr)_3.75rem] items-center gap-2">
            <label for="fuji-tint" class="text-xs text-immich-fg/75 dark:text-immich-dark-fg/75">
              {$t('fuji_develop_tint')}
            </label>
            <input
              id="fuji-tint"
              type="range"
              min={FUJI_DEVELOP_CONTROL_CONFIG.tint.minimum}
              max={FUJI_DEVELOP_CONTROL_CONFIG.tint.maximum}
              step={FUJI_DEVELOP_CONTROL_CONFIG.tint.step}
              value={settings.tint ?? 0}
              oninput={(event) => (settings.tint = Number(event.currentTarget.value))}
              disabled={controlsDisabled}
              class="min-w-0 accent-primary"
            />
            <input
              aria-label={$t('fuji_develop_tint_value')}
              type="number"
              min={FUJI_DEVELOP_CONTROL_CONFIG.tint.minimum}
              max={FUJI_DEVELOP_CONTROL_CONFIG.tint.maximum}
              step={FUJI_DEVELOP_CONTROL_CONFIG.tint.step}
              value={settings.tint ?? ''}
              placeholder={$t('fuji_develop_as_shot_short')}
              onchange={(event) => setNullableSetting('tint', event.currentTarget.value)}
              disabled={controlsDisabled}
              class="h-7 w-15 rounded-md border border-black/10 bg-gray-100 px-1.5 text-right text-xs tabular-nums outline-hidden focus:border-primary dark:border-white/10 dark:bg-gray-800"
            />
          </div>

          <div class="my-2 border-t border-black/5 dark:border-white/5"></div>

          <DetailPanelDevelopSlider
            id="fuji-vibrance"
            label={$t('fuji_develop_vibrance')}
            minimum={FUJI_DEVELOP_CONTROL_CONFIG.vibrance.minimum}
            maximum={FUJI_DEVELOP_CONTROL_CONFIG.vibrance.maximum}
            step={FUJI_DEVELOP_CONTROL_CONFIG.vibrance.step}
            bind:value={settings.vibrance}
            disabled={controlsDisabled}
          />
          <DetailPanelDevelopSlider
            id="fuji-saturation"
            label={$t('fuji_develop_saturation')}
            minimum={FUJI_DEVELOP_CONTROL_CONFIG.saturation.minimum}
            maximum={FUJI_DEVELOP_CONTROL_CONFIG.saturation.maximum}
            step={FUJI_DEVELOP_CONTROL_CONFIG.saturation.step}
            bind:value={settings.saturation}
            disabled={controlsDisabled}
          />

          <button
            type="button"
            class="mt-2 text-xs text-primary hover:underline disabled:opacity-50"
            onclick={() => {
              settings.temperature = null;
              settings.tint = null;
            }}
            disabled={controlsDisabled || (settings.temperature === null && settings.tint === null)}
          >
            {$t('fuji_develop_use_as_shot_white_balance')}
          </button>
        </div>
      </details>

      {#if isLoading}
        <p class="mt-2 text-xs text-immich-fg/60 dark:text-immich-dark-fg/60">{$t('fuji_develop_loading')}</p>
      {:else if loadError}
        <p class="mt-2 text-xs text-red-600 dark:text-red-400">{loadError}</p>
      {:else if renderState === 'pending'}
        <p class="mt-2 text-xs text-amber-700 dark:text-amber-300">{applyError}</p>
      {:else if applyError}
        <p class="mt-2 text-xs text-red-600 dark:text-red-400">{applyError}</p>
      {:else if renderState === 'rendering'}
        <p class="mt-2 text-xs text-immich-fg/60 dark:text-immich-dark-fg/60">{$t('fuji_develop_rendering')}</p>
      {:else if hasUnsavedChanges}
        <p class="mt-2 text-xs text-amber-700 dark:text-amber-300">{$t('fuji_develop_unsaved')}</p>
      {:else if renderState === 'ready'}
        <p class="mt-2 text-xs text-immich-fg/60 dark:text-immich-dark-fg/60">{$t('fuji_develop_ready')}</p>
      {/if}

      <div class="mt-3 flex gap-2">
        <button
          type="button"
          class="flex-1 rounded-full bg-immich-primary px-4 py-2 text-sm font-semibold text-white hover:bg-immich-primary/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-immich-dark-primary dark:text-black"
          onclick={applyDevelop}
          disabled={isLoading || isApplying || Boolean(loadError) || !hasUnsavedChanges}
          data-testid="fuji-develop-apply"
        >
          {isApplying ? $t('fuji_develop_rendering') : $t('fuji_develop_apply')}
        </button>
        <button
          type="button"
          class="rounded-full border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/5"
          onclick={resetDevelop}
          disabled={isLoading || isApplying || Boolean(loadError)}
          data-testid="fuji-develop-reset"
        >
          {$t('reset')}
        </button>
      </div>
    </div>
  {/if}
</div>
