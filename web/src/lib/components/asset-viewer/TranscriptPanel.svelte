<script lang="ts">
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { videoPlayerManager } from '$lib/managers/video-player-manager.svelte';
  import {
    getAssetTranscript,
    TranscriptionStatus,
    type AssetResponseDto,
    type AssetTranscriptResponseDto,
    type TranscriptSegmentResponseDto,
  } from '@immich/sdk';
  import { Button, IconButton, LoadingSpinner, Text } from '@immich/ui';
  import { mdiClose, mdiCrosshairsGps } from '@mdi/js';
  import { Duration } from 'luxon';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    onClose: () => void;
  }

  let { asset, onClose }: Props = $props();

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
    query ? segments.filter((segment) => segment.text.toLocaleLowerCase().includes(query)) : segments,
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
    const node = activeNode;
    if (!listElement || !node) {
      return;
    }

    const container = listElement.getBoundingClientRect();
    const line = node.getBoundingClientRect();
    // Only when the line has left the visible part of the panel, so that following playback is a
    // nudge every few lines rather than a jump on every one.
    if (line.top >= container.top && line.bottom <= container.bottom) {
      return;
    }

    listElement.scrollTop += line.top - container.top - (container.height - line.height) / 2;
    expectedScrollTop = listElement.scrollTop;
  };

  // Re-runs whenever the highlighted line moves, including when filtering changes which lines exist.
  $effect(() => {
    if (followPlayback && activeNode) {
      scrollToActiveSegment();
    }
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
          <button
            type="button"
            aria-current={isActive ? 'true' : undefined}
            class={[
              'flex w-full gap-3 rounded-lg px-2 py-1.5 text-start hover:bg-gray-200 dark:hover:bg-immich-dark-gray',
              isActive && 'bg-primary/10 dark:bg-primary/25',
            ]}
            onclick={() => handleSegmentClick(segment)}
          >
            <span class="shrink-0 pt-0.5 font-mono text-xs text-immich-fg/60 tabular-nums dark:text-immich-dark-fg/60">
              {formatTimestamp(segment.startTime)}
            </span>
            <span class={['text-sm', isActive ? 'font-medium' : 'text-immich-fg/90 dark:text-immich-dark-fg/90']}>
              {segment.text}
            </span>
          </button>
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
