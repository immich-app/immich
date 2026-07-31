<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { videoPlayerManager } from '$lib/managers/video-player-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import {
    getAssetTranscript,
    updateTranscriptSegment,
    TranscriptionStatus,
    type AssetResponseDto,
    type AssetTranscriptResponseDto,
    type TranscriptSegmentResponseDto,
  } from '@immich/sdk';
  import { Button, IconButton, LoadingSpinner, Text, Textarea, toastManager } from '@immich/ui';
  import { mdiClose, mdiCrosshairsGps, mdiHistory, mdiPencilOutline } from '@mdi/js';
  import { Duration } from 'luxon';
  import { t } from 'svelte-i18n';
  import { fromAction } from 'svelte/attachments';

  interface Props {
    asset: AssetResponseDto;
    onClose: () => void;
  }

  let { asset, onClose }: Props = $props();

  const isOwner = $derived(authManager.authenticated && authManager.user.id === asset.ownerId);

  /** A transcript that is still being produced grows on the server; the panel asks again for it. */
  const POLL_INTERVAL = 15_000;

  let transcript = $state<AssetTranscriptResponseDto>();
  let isLoading = $state(true);
  let hasError = $state(false);
  let filter = $state('');
  let followPlayback = $state(true);
  let listElement = $state<HTMLElement>();
  let activeNode = $state<HTMLElement>();
  /** The scroll position this panel last set itself, to tell its own scrolling from the reader's. */
  let expectedScrollTop: number | undefined;

  $effect(() => {
    const id = asset.id;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      let status: TranscriptionStatus | undefined;

      try {
        const result = await getAssetTranscript({ ...authManager.params, id });
        if (cancelled) {
          return;
        }

        transcript = result;
        status = result.status;
        hasError = false;
      } catch {
        if (cancelled) {
          return;
        }

        // A failed refresh of a transcript already on screen is not worth blanking it for; the next
        // tick will either replace it or keep it.
        hasError = !transcript;
        status = transcript?.status;
      }

      isLoading = false;

      // A finished transcript never changes again, so polling stops rather than asking forever.
      if (status !== TranscriptionStatus.Complete) {
        timer = setTimeout(() => void load(), POLL_INTERVAL);
      }
    };

    void load();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      transcript = undefined;
      isLoading = true;
      hasError = false;
      filter = '';
      followPlayback = true;
      expectedScrollTop = undefined;
    };
  });

  const segments = $derived(transcript?.segments ?? []);
  const status = $derived(transcript?.status);
  const isInProgress = $derived(status === TranscriptionStatus.InProgress);

  const query = $derived(filter.trim().toLocaleLowerCase());
  const visibleSegments = $derived(
    query
      ? segments.filter((segment) => (segment.correctedText ?? segment.text).toLocaleLowerCase().includes(query))
      : segments,
  );

  /**
   * The last line to have begun, rather than only a line strictly containing the playhead: speech
   * has gaps, and blanking the highlight in every pause reads as a bug rather than as silence.
   */
  const activeSegment = $derived.by(() => {
    const currentTime = videoPlayerManager.currentTimeOf(asset.id);
    if (currentTime === undefined) {
      return undefined;
    }

    let active: TranscriptSegmentResponseDto | undefined;
    for (const segment of segments) {
      if (segment.startTime > currentTime) {
        break;
      }
      active = segment;
    }

    return active;
  });

  const durationMs = $derived(asset.duration ?? 0);
  const progressPercent = $derived(
    durationMs > 0 ? Math.min(100, Math.round(((transcript?.progressMs ?? 0) / durationMs) * 100)) : 0,
  );
  const timestampFormat = $derived(durationMs >= 3_600_000 ? 'h:mm:ss' : 'mm:ss');
  const formatTimestamp = (seconds: number) =>
    Duration.fromObject({ seconds: Math.floor(seconds) }).toFormat(timestampFormat);

  const scrollToActiveSegment = () => {
    if (!listElement) {
      return;
    }

    const node = activeNode;
    if (node) {
      const container = listElement.getBoundingClientRect();
      const line = node.getBoundingClientRect();
      // Only when the line has left the visible part of the panel, so that following playback is a
      // nudge every few lines rather than a jump on every one.
      if (line.top < container.top || line.bottom > container.bottom) {
        listElement.scrollTop += line.top - container.top - (container.height - line.height) / 2;
      }
    }

    expectedScrollTop = listElement.scrollTop;
  };

  // Re-runs whenever the highlighted line moves and whenever filtering changes which lines exist.
  $effect(() => {
    const count = visibleSegments.length;
    if (!listElement) {
      return;
    }

    if (followPlayback && count > 0) {
      scrollToActiveSegment();
      return;
    }

    // Filtering resizes the scrollable area and the browser clamps the scroll position to fit.
    // That is this panel's own doing rather than the reader's, so it is adopted instead of being
    // read as manual scrolling and switching following off.
    expectedScrollTop = listElement.scrollTop;
  });

  /**
   * Any scroll this panel did not perform itself is the reader's, and following defers to it until
   * they ask for it back. Comparing against the position last set is what distinguishes the two,
   * and is why the automatic scroll is instant rather than smooth: a smooth one would report
   * positions that this panel never set and read as manual scrolling.
   */
  const onScroll = () => {
    if (listElement && listElement.scrollTop !== expectedScrollTop) {
      followPlayback = false;
    }
  };

  const resumeFollowing = () => {
    followPlayback = true;
    scrollToActiveSegment();
  };

  const handleSegmentClick = (segment: TranscriptSegmentResponseDto) => {
    videoPlayerManager.seek(asset.id, segment.startTime);
    // Jumping to a line is a statement about where attention is, so the panel takes it as one.
    followPlayback = true;
  };

  let editingSegmentId = $state<string>();
  let editValue = $state('');
  /** Distinguishes an Escape-triggered blur, which should discard the edit, from every other blur. */
  let editCancelled = false;

  const startEditing = (segment: TranscriptSegmentResponseDto) => {
    editingSegmentId = segment.id;
    editValue = segment.correctedText ?? segment.text;
  };

  const cancelEditing = () => {
    editCancelled = true;
  };

  const applyCorrection = async (segment: TranscriptSegmentResponseDto, correctedText: string | null) => {
    try {
      const updated = await updateTranscriptSegment({
        ...authManager.params,
        id: asset.id,
        segmentId: segment.id,
        updateTranscriptSegmentDto: { correctedText },
      });

      if (transcript) {
        transcript = {
          ...transcript,
          segments: transcript.segments.map((existing) => (existing.id === segment.id ? updated : existing)),
        };
      }

      toastManager.primary(
        correctedText === null ? $t('transcript_correction_reverted') : $t('transcript_correction_saved'),
      );
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_transcript_correction'));
    }
  };

  const saveEditing = (segment: TranscriptSegmentResponseDto) => {
    editingSegmentId = undefined;

    if (editCancelled) {
      editCancelled = false;
      return;
    }

    const trimmed = editValue.trim();
    const current = segment.correctedText ?? segment.text;
    if (trimmed === current) {
      return;
    }

    // An empty line, or one typed back to exactly what the model said, both mean "no correction of
    // my own belongs here" — the same as pressing revert — rather than a blank or redundant
    // correction sent to the server.
    void applyCorrection(segment, trimmed.length === 0 || trimmed === segment.text ? null : trimmed);
  };

  const revertSegment = (segment: TranscriptSegmentResponseDto) => void applyCorrection(segment, null);
</script>

<section class="flex h-full flex-col overflow-hidden bg-light" data-testid="transcript-panel">
  <div class="flex place-items-center gap-2 p-2">
    <IconButton
      icon={mdiClose}
      aria-label={$t('close')}
      onclick={onClose}
      shape="round"
      color="secondary"
      variant="ghost"
    />
    <p class="text-lg text-immich-fg dark:text-immich-dark-fg">{$t('transcript')}</p>
  </div>

  <div class="px-2 pb-2">
    <SearchBar bind:name={filter} placeholder={$t('filter_transcript')} showLoadingSpinner={false} />
  </div>

  {#if isInProgress}
    <div class="flex place-items-center gap-2 px-4 pb-2" data-testid="transcript-in-progress">
      <LoadingSpinner />
      <Text size="small" color="muted">
        {$t('transcript_in_progress', { values: { percent: progressPercent } })}
      </Text>
    </div>
  {/if}

  <ol
    class="relative grow overflow-y-auto px-2 pb-4"
    aria-label={$t('transcript')}
    bind:this={listElement}
    onscroll={onScroll}
  >
    {#if isLoading}
      <li class="flex place-content-center p-4"><LoadingSpinner /></li>
    {:else if hasError}
      <li class="p-4"><Text color="muted">{$t('errors.unable_to_load_transcript')}</Text></li>
    {:else if segments.length === 0}
      <li class="p-4">
        <Text color="muted">
          {#if status === TranscriptionStatus.InProgress}
            {$t('transcript_pending_lines')}
          {:else if status === TranscriptionStatus.Complete}
            {$t('transcript_no_speech')}
          {:else}
            {$t('transcript_not_started')}
          {/if}
        </Text>
      </li>
    {:else if visibleSegments.length === 0}
      <li class="p-4"><Text color="muted">{$t('transcript_no_matches')}</Text></li>
    {:else}
      {#each visibleSegments as segment (segment.id)}
        {@const isActive = segment.id === activeSegment?.id}
        {@const isCorrected = segment.correctedText !== null}
        {@const isEditing = editingSegmentId === segment.id}
        <li
          {@attach (node) => {
            if (!isActive) {
              return;
            }

            activeNode = node;
            // Guarded, because the line taking over registers before this one is torn down.
            return () => {
              if (activeNode === node) {
                activeNode = undefined;
              }
            };
          }}
        >
          <div
            class={[
              'flex w-full items-start gap-2 rounded-lg px-2 py-1.5',
              !isEditing && 'hover:bg-gray-200 dark:hover:bg-immich-dark-gray',
              isActive && 'bg-primary/10 dark:bg-primary/25',
            ]}
          >
            {#if isEditing}
              <span
                class="shrink-0 pt-1.5 font-mono text-xs text-immich-fg/60 tabular-nums dark:text-immich-dark-fg/60"
              >
                {formatTimestamp(segment.startTime)}
              </span>
              <Textarea
                bind:value={editValue}
                autofocus
                rows={1}
                grow
                class="text-sm"
                data-testid="transcript-segment-input"
                onfocusout={() => saveEditing(segment)}
                {@attach fromAction(shortcuts, () => [
                  { shortcut: { key: 'Enter' }, onShortcut: (e) => e.currentTarget.blur() },
                  {
                    shortcut: { key: 'Escape' },
                    onShortcut: (e) => {
                      cancelEditing();
                      e.currentTarget.blur();
                    },
                  },
                ])}
              />
            {:else}
              <button
                type="button"
                aria-current={isActive ? 'true' : undefined}
                class="flex grow gap-3 text-start"
                onclick={() => handleSegmentClick(segment)}
              >
                <span
                  class="shrink-0 pt-0.5 font-mono text-xs text-immich-fg/60 tabular-nums dark:text-immich-dark-fg/60"
                >
                  {formatTimestamp(segment.startTime)}
                </span>
                <span class="min-w-0 grow">
                  <span class={['text-sm', isActive ? 'font-medium' : 'text-immich-fg/90 dark:text-immich-dark-fg/90']}>
                    {segment.correctedText ?? segment.text}
                  </span>
                  {#if isCorrected}
                    <span
                      class="ms-1.5 rounded-sm bg-primary/10 px-1 py-0.5 text-[10px] font-medium text-primary uppercase"
                      data-testid="transcript-corrected-badge"
                    >
                      {$t('transcript_corrected')}
                    </span>
                    <Text size="tiny" color="muted" class="mt-0.5 block italic" data-testid="transcript-original-text">
                      {$t('transcript_original_text', { values: { text: segment.text } })}
                    </Text>
                  {/if}
                </span>
              </button>
              {#if isOwner}
                <div class="flex shrink-0 gap-0.5">
                  <IconButton
                    icon={mdiPencilOutline}
                    aria-label={$t('edit')}
                    onclick={() => startEditing(segment)}
                    shape="round"
                    color="secondary"
                    variant="ghost"
                    size="small"
                    data-testid="transcript-edit-button"
                  />
                  {#if isCorrected}
                    <IconButton
                      icon={mdiHistory}
                      aria-label={$t('restore')}
                      onclick={() => revertSegment(segment)}
                      shape="round"
                      color="secondary"
                      variant="ghost"
                      size="small"
                      data-testid="transcript-revert-button"
                    />
                  {/if}
                </div>
              {/if}
            {/if}
          </div>
        </li>
      {/each}
    {/if}
  </ol>

  {#if !followPlayback && activeSegment}
    <div class="flex place-content-center p-2">
      <Button size="small" variant="outline" color="secondary" leadingIcon={mdiCrosshairsGps} onclick={resumeFollowing}>
        {$t('transcript_follow_playback')}
      </Button>
    </div>
  {/if}
</section>
