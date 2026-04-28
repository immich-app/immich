<script lang="ts">
  import { Icon, IconButton, Modal, modalManager, ModalBody } from '@immich/ui';
  import { mdiClose, mdiMagnify } from '@mdi/js';
  import { Command } from 'bits-ui';
  import { t } from 'svelte-i18n';
  import type { GlobalSearchManager, SearchMode } from '$lib/managers/global-search-manager.svelte';
  import GlobalSearchSection from './global-search-section.svelte';
  import GlobalSearchNavigationSections from './global-search-navigation-sections.svelte';
  import GlobalSearchCommandsSection from './global-search-commands-section.svelte';
  import PhotoRow from './rows/photo-row.svelte';
  import PersonRow from './rows/person-row.svelte';
  import PlaceRow from './rows/place-row.svelte';
  import TagRow from './rows/tag-row.svelte';
  import AlbumRow from './rows/album-row.svelte';
  import SpaceRow from './rows/space-row.svelte';
  import RecentRow from './rows/recent-row.svelte';
  import NavigationRow from './rows/navigation-row.svelte';
  import CommandRow from './rows/command-row.svelte';
  import GlobalSearchFooter from './global-search-footer.svelte';
  import GlobalSearchPreview from './global-search-preview.svelte';
  import ShortcutsModal from '$lib/modals/ShortcutsModal.svelte';
  import { mediaQueryManager } from '$lib/stores/media-query-manager.svelte';
  import { getEntries, type RecentEntry } from '$lib/stores/cmdk-recent';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { NAVIGATION_ITEMS, type NavigationItem } from '$lib/managers/navigation-items';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';

  interface Props {
    manager: GlobalSearchManager;
  }
  let { manager }: Props = $props();

  // Two-way sync with manager.query: the user types into the Command.Input (writes to
  // inputValue), and the manager can also update its own query internally (e.g. when
  // activateRecent replays a saved query). A plain `$derived(manager.query)` isn't
  // enough because inputValue needs to be writable (bound by Command.Input); and
  // `$state` + `$effect` is flagged by svelte/prefer-writable-derived. The cleanest
  // Svelte 5 shape for a bi-directional mirror is to keep $state and push changes in
  // both directions via $effect. The rule's preferred pattern doesn't fit this case.
  // eslint-disable-next-line svelte/prefer-writable-derived
  let inputValue = $state('');
  $effect(() => {
    inputValue = manager.query;
  });
  let selectedValue = $state<string>('');

  function setSelectedValue(value: string | null) {
    selectedValue = value ?? '';
    manager.setActiveItem(value);
  }

  function syncSelectedValueFromBits(value: string) {
    if (manager.activeItemId === manager.topSearchMatch?.id) {
      selectedValue = '';
      return;
    }
    setSelectedValue(value);
  }

  $effect(() => {
    manager.setQuery(inputValue);
  });

  // bits-ui's built-in scroll-into-view logic has a quirk: when the selected item is
  // the FIRST item of its group, it scrolls the group HEADING into view instead of the
  // item and returns early (see command.svelte.js `#scrollSelectedIntoView`). If the
  // heading was already partially visible, that's a no-op — leaving the newly focused
  // item off-screen. We override with our own scroll AFTER bits-ui's afterTick handler
  // runs. requestAnimationFrame ensures we run post-paint, so bits-ui's scroll (if any)
  // has already been applied and we layer our adjustment on top.
  $effect(() => {
    if (!selectedValue) {
      return;
    }
    const raf = requestAnimationFrame(() => {
      const item = document.querySelector<HTMLElement>(
        `[data-command-item][data-value="${CSS.escape(selectedValue)}"]`,
      );
      item?.scrollIntoView({ block: 'nearest' });
    });
    return () => cancelAnimationFrame(raf);
  });

  // Reset the preview pane's scroll position whenever the active item changes. The
  // pane has `overflow-y-auto`, and browser behavior around `scrollIntoView` on
  // deeply-nested descendants can leave unrelated scrollable ancestors in a non-zero
  // scroll state, clipping the top of the newly-rendered preview. Forcing scrollTop
  // = 0 here guarantees each fresh preview starts at the top with its own padding
  // intact.
  $effect(() => {
    void manager.activeItemId;
    queueMicrotask(() => {
      const pane = document.querySelector<HTMLElement>('[data-cmdk-preview]');
      if (pane) {
        pane.scrollTop = 0;
      }
    });
  });

  $effect(() => {
    if (manager.activeItemId === 'top-search') {
      if (selectedValue !== '') {
        selectedValue = '';
      }
      return;
    }
    if (manager.activeItemId && manager.activeItemId !== selectedValue) {
      setSelectedValue(manager.activeItemId);
    }
  });

  // Key top-slot auto-selection/dismissal by both the current query text and a
  // monotonically increasing input-edit revision. This lets the preferred top row
  // (promoted command/nav or the synthetic search row) re-arm after rapid edit
  // sequences that end back on a previously dismissed string.
  let inputEditRevision = $state(0);
  let lastAutoSelectedTopResultToken = $state<string | null>(null);
  let lastDismissedTopResultToken = $state<string | null>(null);
  const preferredTopResultId = $derived.by<string | null>(() => {
    if (manager.topCommandMatch) {
      return manager.topCommandMatch.id;
    }
    if (manager.topNavigationMatch) {
      return manager.topNavigationMatch.id;
    }
    return manager.topSearchMatch?.id ?? null;
  });
  const preferredTopResultToken = $derived.by<string | null>(() => {
    const query = manager.query.trim();
    if (manager.topCommandMatch) {
      return `${inputEditRevision}:command:${manager.topCommandMatch.id}:${query}`;
    }
    if (manager.topNavigationMatch) {
      return `${inputEditRevision}:navigation:${manager.topNavigationMatch.id}:${query}`;
    }
    if (manager.topSearchMatch) {
      return `${inputEditRevision}:search:${manager.topSearchMatch.query}`;
    }
    return null;
  });
  let previousActiveItemId = $state<string | null>(null);
  $effect(() => {
    const topResultId = preferredTopResultId;
    const topResultToken = preferredTopResultToken;
    if (!topResultId || !topResultToken) {
      lastAutoSelectedTopResultToken = null;
      lastDismissedTopResultToken = null;
      previousActiveItemId = manager.activeItemId;
      return;
    }
    if (previousActiveItemId === topResultId && manager.activeItemId !== topResultId) {
      lastDismissedTopResultToken = topResultToken;
    }
    if (lastAutoSelectedTopResultToken !== topResultToken && lastDismissedTopResultToken !== topResultToken) {
      if (topResultId === 'top-search') {
        selectedValue = '';
      }
      manager.setActiveItem(topResultId);
      lastAutoSelectedTopResultToken = topResultToken;
    }
    previousActiveItemId = manager.activeItemId;
  });

  // Render-time filter: drop unreachable navigate recents before they hit the DOM.
  // Mirrors the live-catalog logic in activateRecent — an admin demotion, a disabled
  // feature flag, or an upstream upgrade that removed a page would otherwise leave
  // stale recents visible until clicked. Using `$user` (reactive auto-subscription)
  // instead of `get(user)` so the derived re-runs when the user store updates
  // mid-session (logout/login, role change).
  //
  // `manager.recentsRevision` is read as a reactive dependency so mid-session
  // mutations (deleting a highlighted row, per-row X click) re-evaluate this
  // derived in the same tick — cmdk-recent is a plain-function store so we
  // cannot rely on Svelte store subscriptions to invalidate the list.
  const recentEntries = $derived<RecentEntry[]>(
    (() => {
      if (inputValue.trim() !== '') {
        return [];
      }
      void manager.recentsRevision;
      const isAdmin = (authManager.authenticated ? authManager.user : undefined)?.isAdmin ?? false;
      const flags = featureFlagsManager.valueOrUndefined;
      return getEntries().filter((e) => {
        if (e.kind !== 'navigate') {
          return true;
        }
        const live = NAVIGATION_ITEMS.find((n) => n.id === e.id);
        if (!live) {
          return false;
        }
        if (live.adminOnly && !isAdmin) {
          return false;
        }
        if (live.featureFlag && !flags?.[live.featureFlag]) {
          return false;
        }
        return true;
      });
    })(),
  );
  // Cold-start "quick links" fallback. When the palette opens with a blank
  // query AND no recents, it's a visually empty surface — just a helper
  // string. Surface the user-pages navigation catalog (Photos, Albums,
  // Spaces, People, Map, etc.) so there is something immediately clickable
  // and keyboard-navigable. Filtered by the same feature-flag / admin gates
  // as the navigation provider.
  // Admin items are intentionally excluded — the cold palette is a quick-jump
  // surface for the user's own content, not a settings drawer. Admins still
  // reach admin pages via typed search.
  const quickLinks = $derived<NavigationItem[]>(
    (() => {
      if (inputValue.trim() !== '' || recentEntries.length > 0) {
        return [];
      }
      const flags = featureFlagsManager.valueOrUndefined;
      return NAVIGATION_ITEMS.filter((item) => {
        if (item.category !== 'userPages') {
          return false;
        }
        if (item.featureFlag && !flags?.[item.featureFlag]) {
          return false;
        }
        return true;
      });
    })(),
  );
  // Strip the promoted "Top result" nav item out of the regular Navigation
  // section below so the same Command.Item id doesn't render twice. bits-ui
  // routes keyboard selection via the `value` attribute, so duplicates would
  // highlight both rows and break the cursor model.
  const dedupedNavigationStatus = $derived.by(() => {
    const status = manager.sections.navigation;
    const top = manager.topNavigationMatch;
    if (!top || status.status !== 'ok') {
      return status;
    }
    const items = status.items.filter((i) => (i as NavigationItem).id !== top.id);
    return { status: 'ok' as const, items, total: items.length };
  });
  const showPreview = $derived(mediaQueryManager.minLg);

  // Progress stripe: only show after a 200ms grace window. A clean setTimeout
  // pattern — the effect fires on every batchInFlight transition and the cleanup
  // cancels any pending stripe when the batch settles before the 200ms mark.
  // Fast batches never flash the stripe because the cleanup runs before the timer.
  let stripeArmed = $state(false);
  let stripeTimer: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    if (manager.batchInFlight) {
      stripeTimer = setTimeout(() => {
        stripeArmed = true;
      }, 200);
      return () => {
        if (stripeTimer !== null) {
          clearTimeout(stripeTimer);
          stripeTimer = null;
        }
        stripeArmed = false;
      };
    }
  });

  const showProgressStripe = $derived(stripeArmed && manager.batchInFlight);

  function clearOrClose() {
    if (inputValue !== '') {
      inputValue = '';
      return;
    }
    manager.close();
  }

  function moveSelectionFromTopSearch(direction: 1 | -1) {
    const topSearchId = manager.topSearchMatch?.id;
    const currentValue = selectedValue || manager.activeItemId;
    if (!topSearchId || currentValue !== topSearchId) {
      return false;
    }
    const items = [...document.querySelectorAll<HTMLElement>('[data-command-item]')];
    if (items.length === 0) {
      return false;
    }
    const target = direction === 1 ? items[0] : items.at(-1);
    const nextValue = target?.dataset.value;
    if (!nextValue) {
      return false;
    }
    setSelectedValue(nextValue);
    return true;
  }

  function onKeyDown(e: KeyboardEvent) {
    // Bare `?` opens the app-wide keyboard shortcuts modal. No modifiers — Ctrl/Alt/Meta
    // fall through so browser chords (e.g. a custom user-agent binding) still work.
    // Must sit above every other key branch so a stale handler doesn't swallow the key.
    if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      void modalManager.show(ShortcutsModal, {});
      e.preventDefault();
      return;
    }
    // Escape while a destructive-confirm is armed reverts the red row without
    // closing the palette. Second Escape (pending cleared) falls through to
    // clearOrClose below.
    if (e.key === 'Escape' && manager.pendingConfirmId !== null) {
      manager.cancelConfirm();
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (e.key === 'Escape') {
      clearOrClose();
      e.preventDefault();
      return;
    }
    if (e.ctrlKey && e.key === 'k') {
      manager.close();
      e.preventDefault();
      return;
    }
    if (e.ctrlKey && e.key === '/') {
      // The layout-level use:shortcuts binding for Ctrl+/ has ignoreInputFields=true
      // by default (the @immich/ui shortcut action skips events whose target is an
      // input), so it won't fire while the palette's Command.Input is focused. Handle
      // the cycle here instead — same behavior, different listener.
      const order: SearchMode[] = ['smart', 'metadata', 'description', 'ocr'];
      const next = order[(order.indexOf(manager.mode) + 1) % order.length];
      manager.setMode(next);
      e.preventDefault();
      return;
    }
    // Delete / Backspace in recents mode (empty input) prunes the highlighted
    // row. Backspace is a no-op in an empty input so hijacking it doesn't
    // interfere with text editing; Delete is the forward-delete semantic and
    // does nothing useful in an empty input either. Once the user has typed
    // anything, both keys revert to their native behaviour so the combobox is
    // still editable.
    if ((e.key === 'Delete' || e.key === 'Backspace') && inputValue === '' && manager.activeItemId) {
      manager.removeRecent(manager.activeItemId);
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter' && manager.topSearchMatch && manager.activeItemId === manager.topSearchMatch.id) {
      manager.activateSearch(manager.topSearchMatch.query);
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowDown' && moveSelectionFromTopSearch(1)) {
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowUp' && moveSelectionFromTopSearch(-1)) {
      e.preventDefault();
      return;
    }
    if (e.key === 'Home' || e.key === 'End') {
      // bits-ui tags each Command.Item with a data-command-item attribute (see
      // bits-ui command.svelte.js:1204 — `createBitsAttrs({ component: 'command' ... })`
      // yields `data-command-${part}`). Using the wrong attribute name silently breaks nav.
      // NodeList doesn't support .at() in happy-dom, so materialise to an array first.
      const items = [...document.querySelectorAll<HTMLElement>('[data-command-item]')];
      if (items.length === 0) {
        return;
      }
      const target = e.key === 'Home' ? items[0] : items.at(-1);
      const value = target?.dataset.value;
      if (value) {
        manager.setActiveItem(value);
        e.preventDefault();
      }
    }
  }
</script>

<Modal
  size="large"
  closeOnEsc={false}
  closeOnBackdropClick={true}
  onClose={() => manager.close()}
  class="motion-reduce:transition-none motion-reduce:transform-none !p-0"
>
  <ModalBody class="!p-0">
    <span class="sr-only" id="global-search-label">{$t('global_search')}</span>
    <Command.Root
      shouldFilter={false}
      vimBindings={false}
      loop
      bind:value={() => selectedValue, syncSelectedValueFromBits}
      aria-labelledby="global-search-label"
      onkeydown={onKeyDown}
      class="flex h-full min-h-0 flex-col"
    >
      <div class="flex items-center border-b border-gray-200 dark:border-gray-700">
        <Command.Input
          bind:value={inputValue}
          autofocus
          placeholder={$t('cmdk_placeholder')}
          maxlength={256}
          oninput={() => inputEditRevision++}
          class="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none"
        />
        <IconButton
          icon={mdiClose}
          size="small"
          variant="ghost"
          shape="round"
          color="secondary"
          class="me-2"
          onclick={clearOrClose}
          aria-label={inputValue === '' ? $t('close') : $t('clear')}
        />
      </div>
      {#if showProgressStripe}
        <div
          aria-hidden="true"
          data-cmdk-progress
          class="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent bg-[length:200%_100%] animate-cmdk-shimmer motion-reduce:animate-none"
        ></div>
      {/if}

      <!-- Mobile (<sm): grow into the full-height Modal Card via flex-1 + min-h-0
               so the palette fills the screen instead of leaving dead space below
               the footer. The chain is Modal h-full → CardBody h-full → Command.Root
               h-full → this row flex-1.
           Desktop (sm+): Modal collapses to sm:h-min, so flex-1 has no basis.
               Switch to a fixed `sm:h-[520px]` (with `sm:max-h-[80vh]` clamp for
               short viewports) to give Command.List + the preview pane a definite
               height so internal `overflow-y-auto` actually scrolls. -->
      <!-- `min-w-0` on the left column is critical: flex children default to
               `min-width: auto` (= content size), so without it the column refuses
               to shrink below the widest row (long filenames) and the whole row
               grows wider than the modal/viewport — pushing the fixed-width preview
               pane off-screen. With min-w-0, flex-1 can shrink below content width
               and the rows' `truncate` class ellipsizes long text. -->
      <div class="flex flex-1 min-h-0 sm:h-[520px] sm:max-h-[80vh] sm:flex-none">
        <div
          class="flex min-h-0 min-w-0 flex-1 flex-col {showPreview
            ? 'border-e border-gray-200 dark:border-gray-700'
            : ''}"
        >
          {#if manager.mode === 'smart' && !manager.mlHealthy && inputValue.trim() !== '' && manager.scope === 'all'}
            <div class="mx-3 mt-3 rounded-md bg-subtle/60 px-3 py-2 text-xs">
              {$t('cmdk_smart_unavailable')}
              <button
                type="button"
                onclick={() => manager.setMode('metadata')}
                class="ml-2 text-primary transition-colors duration-[80ms] ease-out"
              >
                {$t('cmdk_try_filename')}
              </button>
            </div>
          {/if}
          <Command.List class="flex-1 overflow-y-auto py-2">
            {#if inputValue.trim() === ''}
              {#if recentEntries.length > 0}
                <Command.Group>
                  <Command.GroupHeading
                    class="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {$t('cmdk_recent_heading')}
                  </Command.GroupHeading>
                  <Command.GroupItems>
                    {#each recentEntries as entry (entry.id)}
                      <Command.Item
                        value={entry.id}
                        onSelect={() => manager.activateRecent(entry)}
                        class="group relative"
                      >
                        <RecentRow {entry} />
                        <!-- Per-row remove affordance. Hidden by default, surfaced on
                             hover OR when the row is keyboard-selected (data-selected
                             from bits-ui) so both input modes have a visible target.
                             stopPropagation is load-bearing: without it, the surrounding
                             Command.Item treats the click as a selection and triggers
                             activateRecent, which would navigate before the removal UI
                             update could render. -->
                        <button
                          type="button"
                          aria-label={$t('cmdk_remove_from_recents')}
                          class="absolute end-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 opacity-0 transition-opacity duration-[80ms] ease-out hover:bg-black/10 hover:text-gray-900 group-hover:opacity-100 group-data-[selected]:opacity-100 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100"
                          onclick={(e) => {
                            e.stopPropagation();
                            manager.removeRecent(entry.id);
                          }}
                        >
                          <Icon icon={mdiClose} size="1em" aria-hidden />
                        </button>
                      </Command.Item>
                    {/each}
                  </Command.GroupItems>
                </Command.Group>
              {:else if quickLinks.length > 0}
                <Command.Group class="mb-4">
                  <Command.GroupHeading
                    class="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {$t('cmdk_quick_links')}
                  </Command.GroupHeading>
                  <Command.GroupItems>
                    {#each quickLinks as item (item.id)}
                      <Command.Item value={item.id} onSelect={() => manager.activate('nav', item)} class="group">
                        <NavigationRow {item} />
                      </Command.Item>
                    {/each}
                  </Command.GroupItems>
                </Command.Group>
              {:else}
                <div class="p-6 text-center text-[13px] font-normal text-gray-500 dark:text-gray-400">
                  {$t('cmdk_helper')}
                </div>
              {/if}
            {:else if manager.scope === 'all'}
              {#if manager.topSearchMatch}
                <Command.Group class="mb-4" data-cmdk-top-result-search>
                  <Command.GroupHeading
                    class="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {$t('cmdk_top_result')}
                  </Command.GroupHeading>
                  <div class="px-1">
                    <button
                      type="button"
                      onclick={() => manager.topSearchMatch && manager.activateSearch(manager.topSearchMatch.query)}
                      class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start {manager.activeItemId ===
                      manager.topSearchMatch.id
                        ? 'bg-primary/10'
                        : ''}"
                    >
                      <Icon icon={mdiMagnify} />
                      <span>{$t('cmdk_top_search_label', { values: { query: manager.topSearchMatch.query } })}</span>
                    </button>
                  </div>
                </Command.Group>
              {/if}
              {#if manager.topCommandMatch}
                <Command.Group class="mb-4" data-cmdk-top-result-commands>
                  <Command.GroupHeading
                    class="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {$t('cmdk_top_result')}
                  </Command.GroupHeading>
                  <Command.GroupItems>
                    <Command.Item
                      value={manager.topCommandMatch.id}
                      onSelect={() => manager.topCommandMatch && manager.activate('command', manager.topCommandMatch)}
                      class="group"
                    >
                      <CommandRow
                        item={manager.topCommandMatch}
                        pending={manager.topCommandMatch.id === manager.pendingConfirmId}
                      />
                    </Command.Item>
                  </Command.GroupItems>
                </Command.Group>
              {:else if manager.topNavigationMatch}
                <Command.Group class="mb-4" data-cmdk-top-result-navigation>
                  <Command.GroupHeading
                    class="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {$t('cmdk_top_result')}
                  </Command.GroupHeading>
                  <Command.GroupItems>
                    <Command.Item
                      value={manager.topNavigationMatch.id}
                      onSelect={() => manager.topNavigationMatch && manager.activate('nav', manager.topNavigationMatch)}
                      class="group"
                    >
                      <NavigationRow item={manager.topNavigationMatch} />
                    </Command.Item>
                  </Command.GroupItems>
                </Command.Group>
              {/if}
              {#if manager.topCommandMatch}
                <GlobalSearchCommandsSection
                  status={manager.sections.commands}
                  onActivate={(item) => manager.activate('command', item)}
                />
              {/if}
              <GlobalSearchSection
                heading={$t('cmdk_photos_heading')}
                status={manager.sections.photos}
                idPrefix="photo"
                onActivate={(item) => manager.activate('photo', item)}
              >
                {#snippet renderRow(item)}
                  <PhotoRow item={item as never} />
                {/snippet}
              </GlobalSearchSection>
              <!-- Albums + Spaces sit between Photos and People per the v1.1 plan's
                     declared section sequence. Headings use `cmdk_section_albums` /
                     `cmdk_section_spaces` (Task 24). `isPending` wiring reads
                     `manager.pendingActivation` so the row spinner affordance appears for
                     the exact key being activated. -->
              <GlobalSearchSection
                heading={$t('cmdk_section_albums')}
                status={manager.sections.albums}
                idPrefix="album"
                onActivate={(item) => void manager.activateAlbum((item as { id: string }).id)}
              >
                {#snippet renderRow(item)}
                  <AlbumRow
                    item={item as never}
                    isPending={manager.pendingActivation === `album:${(item as { id: string }).id}`}
                  />
                {/snippet}
              </GlobalSearchSection>
              <GlobalSearchSection
                heading={$t('cmdk_section_spaces')}
                status={manager.sections.spaces}
                idPrefix="space"
                onActivate={(item) => void manager.activateSpace((item as { id: string }).id)}
              >
                {#snippet renderRow(item)}
                  <SpaceRow
                    item={item as never}
                    isPending={manager.pendingActivation === `space:${(item as { id: string }).id}`}
                  />
                {/snippet}
              </GlobalSearchSection>
              <GlobalSearchSection
                heading={$t('cmdk_people_heading')}
                status={manager.sections.people}
                idPrefix="person"
                onActivate={(item) => manager.activate('person', item)}
              >
                {#snippet renderRow(item)}
                  <PersonRow item={item as never} />
                {/snippet}
              </GlobalSearchSection>
              <GlobalSearchSection
                heading={$t('cmdk_places_heading')}
                status={manager.sections.places}
                idPrefix="place"
                onActivate={(item) => manager.activate('place', item)}
              >
                {#snippet renderRow(item)}
                  <PlaceRow item={item as never} />
                {/snippet}
              </GlobalSearchSection>
              <GlobalSearchSection
                heading={$t('cmdk_tags_heading')}
                status={manager.sections.tags}
                idPrefix="tag"
                onActivate={(item) => manager.activate('tag', item)}
              >
                {#snippet renderRow(item)}
                  <TagRow item={item as never} />
                {/snippet}
              </GlobalSearchSection>
              {#if !manager.topCommandMatch}
                <GlobalSearchCommandsSection
                  status={manager.sections.commands}
                  onActivate={(item) => manager.activate('command', item)}
                />
              {/if}
              <GlobalSearchNavigationSections
                status={dedupedNavigationStatus}
                onActivate={(item) => manager.activate('nav', item)}
              />
            {:else if manager.scope === 'people'}
              <!-- Scope `@` — only the People section. Other sections force-idled in
                   runBatch so they wouldn't render anyway, but gating the render
                   branch keeps the DOM free of other sections' headings and gives
                   a11y a single contiguous result set. -->
              <GlobalSearchSection
                heading={$t('cmdk_people_heading')}
                status={manager.sections.people}
                idPrefix="person"
                onActivate={(item) => manager.activate('person', item)}
              >
                {#snippet renderRow(item)}
                  <PersonRow item={item as never} />
                {/snippet}
              </GlobalSearchSection>
            {:else if manager.scope === 'tags'}
              <!-- Scope `#` — only the Tags section. -->
              <GlobalSearchSection
                heading={$t('cmdk_tags_heading')}
                status={manager.sections.tags}
                idPrefix="tag"
                onActivate={(item) => manager.activate('tag', item)}
              >
                {#snippet renderRow(item)}
                  <TagRow item={item as never} />
                {/snippet}
              </GlobalSearchSection>
            {:else if manager.scope === 'collections'}
              <!-- Scope `/` — Albums + Spaces. Matches the `ENTITY_KEYS_BY_SCOPE.collections`
                   tuple order so the cursor-reconcile order stays aligned with DOM order. -->
              <GlobalSearchSection
                heading={$t('cmdk_section_albums')}
                status={manager.sections.albums}
                idPrefix="album"
                onActivate={(item) => void manager.activateAlbum((item as { id: string }).id)}
              >
                {#snippet renderRow(item)}
                  <AlbumRow
                    item={item as never}
                    isPending={manager.pendingActivation === `album:${(item as { id: string }).id}`}
                  />
                {/snippet}
              </GlobalSearchSection>
              <GlobalSearchSection
                heading={$t('cmdk_section_spaces')}
                status={manager.sections.spaces}
                idPrefix="space"
                onActivate={(item) => void manager.activateSpace((item as { id: string }).id)}
              >
                {#snippet renderRow(item)}
                  <SpaceRow
                    item={item as never}
                    isPending={manager.pendingActivation === `space:${(item as { id: string }).id}`}
                  />
                {/snippet}
              </GlobalSearchSection>
            {:else if manager.scope === 'nav'}
              <!-- Scope `>` — only NavigationSections. The navigation provider runs
                   synchronously in setQuery (no debounce); under `>` it surfaces the
                   whole catalog for bare `>` or filtered matches for `>foo`. -->
              <GlobalSearchCommandsSection
                status={manager.sections.commands}
                onActivate={(item) => manager.activate('command', item)}
              />
              <GlobalSearchNavigationSections
                status={manager.sections.navigation}
                onActivate={(item) => manager.activate('nav', item)}
              />
            {/if}
          </Command.List>
        </div>
        {#if showPreview}
          <div data-cmdk-preview class="w-[280px] shrink-0 overflow-y-auto min-h-0">
            <GlobalSearchPreview activeItem={manager.getActiveItem()} />
          </div>
        {/if}
      </div>

      <div aria-live="polite" aria-atomic="true" class="sr-only">{manager.announcementText}</div>
      <GlobalSearchFooter {manager} />
    </Command.Root>
  </ModalBody>
</Modal>
