import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import type { FilterState } from '$lib/components/filter-panel/filter-panel';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
import { Route } from '$lib/route';
import { addEntry, getEntries, makePlaceId, removeEntry, type RecentEntry } from '$lib/stores/cmdk-recent';
import { getGlobalPersonHref } from '$lib/utils/global-person-route';
import {
  buildSearchablePageUrl,
  getSearchablePageState,
  type SearchablePageSortOrder,
} from '$lib/utils/searchable-page-search';
import {
  isLiveTypedSearchToken,
  liveTypedSearchChoiceValue,
  resolveLiveTypedSearchSuggestions,
  type LiveTypedSearchChoice,
  type LiveTypedSearchStatus,
  type LiveTypedSearchToken,
} from '$lib/utils/typed-search/typed-search-live-suggestions';
import { getTypedSearchDisplayText, storeTypedSearchNames } from '$lib/utils/typed-search/typed-search-name-cache';
import {
  getActiveTypedSearchToken,
  getTypedSearchTokenIdentity,
  parseTypedSearch,
  rewriteTypedSearchToken,
  type TypedSearchDisplayToken,
  type TypedSearchIssue,
  type TypedSearchParseResult,
  type TypedSearchTokenSpan,
} from '$lib/utils/typed-search/typed-search-parser';
import { resolveTypedSearchFilters, type TypedSearchChoice } from '$lib/utils/typed-search/typed-search-resolver';
import {
  getAlbumInfo,
  getAlbumNames,
  getAllPeople,
  getAllSpaces,
  getAllTags,
  getMlHealth,
  getSpace,
  searchAssets,
  searchPerson,
  searchPlaces,
  searchSmart,
  type AlbumNameDto,
  type MetadataSearchDto,
  type PersonResponseDto,
  type SharedSpaceResponseDto,
  type TagResponseDto,
} from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { computeCommandScore } from 'bits-ui';
import { locale as i18nLocale, t, type Translations } from 'svelte-i18n';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { get } from 'svelte/store';
import { parseScope, personSuggestionsComparator, type ParsedQuery, type Scope } from './cmdk-prefix';
import { commandContextManager } from './command-context-manager.svelte';
import { COMMAND_ITEMS, isAlmostExactCommandMatch, type CommandItem } from './command-items';
import { isAlmostExactNavMatch, NAVIGATION_ITEMS, type NavigationItem } from './navigation-items';

export type SearchMode = 'smart' | 'metadata' | 'description' | 'ocr';
export type SearchPresentation = 'modal' | 'dropdown';

export type ProviderStatus<T = unknown> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; items: T[]; total: number }
  | { status: 'timeout' }
  | { status: 'error'; message: string }
  | { status: 'empty' };

/**
 * Common shape for entity section items. Each entity DTO (photo / person / place /
 * tag) satisfies this structurally — photos/people/tags have `id`, places have
 * `latitude`/`longitude`. Using this as the Sections generic argument matches the
 * shape `GlobalSearchSection` expects and keeps svelte-check happy; plain
 * `ProviderStatus` (default generic `unknown`) would not satisfy the component's
 * `T extends { id?; latitude?; longitude? }` constraint.
 */
export type EntityItem = {
  id?: string;
  latitude?: number;
  longitude?: number;
};

export type Sections = {
  photos: ProviderStatus<EntityItem>;
  people: ProviderStatus<EntityItem>;
  places: ProviderStatus<EntityItem>;
  tags: ProviderStatus<EntityItem>;
  albums: ProviderStatus<EntityItem>;
  spaces: ProviderStatus<EntityItem>;
  navigation: ProviderStatus<NavigationItem>;
  commands: ProviderStatus<CommandItem>;
};

export interface Provider<T = unknown> {
  key: keyof Sections;
  topN: number;
  minQueryLength: number;
  run(query: string, mode: SearchMode, signal: AbortSignal): Promise<ProviderStatus<T>>;
}

export type ActiveItem =
  | { kind: 'photo'; data: unknown }
  | { kind: 'person'; data: unknown }
  | { kind: 'place'; data: unknown }
  | { kind: 'tag'; data: unknown }
  | { kind: 'album'; data: AlbumNameDto }
  | { kind: 'space'; data: SharedSpaceResponseDto }
  | { kind: 'nav'; data: NavigationItem }
  | { kind: 'command'; data: CommandItem };

function selectedChoiceFromLiveChoice(
  choice: LiveTypedSearchChoice,
  rewrittenToken: TypedSearchTokenSpan | undefined,
): TypedSearchChoice | undefined {
  if ((choice.key !== 'person' && choice.key !== 'tag') || !choice.entityId || rewrittenToken?.key !== choice.key) {
    return undefined;
  }

  return {
    tokenRaw: rewrittenToken.raw,
    key: choice.key,
    id: choice.entityId,
    label: choice.label,
    value: rewrittenToken.value,
  };
}

type TopSearchMatch = { id: 'top-search'; query: string; rawQuery: string };

const VALID_MODES: ReadonlySet<SearchMode> = new Set(['smart', 'metadata', 'description', 'ocr']);
// Slice size for the albums section. Kept as a named constant so the buildProviders
// `topN: 5` and the runAlbums slice cannot drift apart silently.
const ALBUMS_TOP_N = 5;
// Slice size for the spaces section. Same rationale as ALBUMS_TOP_N — pin the
// buildProviders `topN` and the runSpaces slice to a single source of truth.
const SPACES_TOP_N = 5;
// Per-provider fetch timeout. Smart search on CPU-only ML (e.g. Mac mini M1) can
// take 6–8s for text encode; 15s gives cold-cache runs headroom without stranding
// a stuck fetch indefinitely.
const PROVIDER_TIMEOUT_MS = 15_000;
// Narrow literal type so it can be assigned to both `ProviderStatus<unknown>` and
// `ProviderStatus<NavigationItem>` without the generic T widening fighting the assignment.
// Frozen so a future engineer cannot accidentally mutate the shared reference and
// cross-contaminate all five sections.
const idle = Object.freeze({ status: 'idle' as const });

function getPersonRoute(person: Pick<PersonResponseDto, 'id' | 'primaryProfile'>): string {
  return getGlobalPersonHref(person);
}

// Entity-section keys dispatched by runBatch per scope. Navigation is intentionally
// absent — it flows through the synchronous `runNavigationProvider` off the debounce
// path. Under a prefix scope, only the matching keys dispatch; all other entity
// sections force-reset to idle synchronously before dispatch. Narrowing the key type
// to just the entity sections (dropping `navigation`) keeps `sections[key] = ...`
// assignments away from the navigation section's `ProviderStatus<NavigationItem>`
// union, which would otherwise force an awkward cast.
// Commands, like navigation, use a distinct `ProviderStatus<CommandItem>` generic
// and are intentionally also excluded from this key set.
type EntitySectionKey = 'photos' | 'people' | 'places' | 'tags' | 'albums' | 'spaces';
const ENTITY_KEYS_BY_SCOPE: Record<Scope, ReadonlyArray<EntitySectionKey>> = {
  all: ['photos', 'people', 'places', 'tags', 'albums', 'spaces'],
  people: ['people'],
  tags: ['tags'],
  collections: ['albums', 'spaces'],
  nav: [],
};

// Priority order used by `reconcileCursor` to pick a new highlight when the
// prior active item disappears from all sections. Unlike `ENTITY_KEYS_BY_SCOPE`
// (which dispatches async providers and intentionally excludes `navigation`),
// this list INCLUDES `navigation` so scope 'all' can fall through to it when
// every entity section is empty. Per-scope orders are scoped down to the
// matching sections so the cursor lands on a row the user's prefix actually
// surfaces — e.g. under `@` the cursor never jumps to an unrelated photo.
//
// The all-scope order matches render order (photos, albums, spaces, people,
// places, tags, navigation) so the cursor lands on the first visible row.
export const RECONCILE_ORDER_BY_SCOPE: Record<Scope, ReadonlyArray<keyof Sections>> = {
  all: ['commands', 'photos', 'albums', 'spaces', 'people', 'places', 'tags', 'navigation'],
  people: ['people'],
  tags: ['tags'],
  collections: ['albums', 'spaces'],
  nav: ['commands', 'navigation'],
};

function isValidRecentEntry(e: RecentEntry): boolean {
  switch (e.kind) {
    case 'query': {
      return typeof e.text === 'string' && e.text.trim().length > 0;
    }
    case 'photo': {
      return typeof e.assetId === 'string' && e.assetId.length > 0;
    }
    case 'person': {
      return typeof e.personId === 'string' && e.personId.length > 0;
    }
    case 'place': {
      return Number.isFinite(e.latitude) && Number.isFinite(e.longitude);
    }
    case 'tag': {
      return typeof e.tagId === 'string' && e.tagId.length > 0;
    }
    case 'album': {
      return typeof e.albumId === 'string' && typeof e.label === 'string';
    }
    case 'space': {
      return typeof e.spaceId === 'string' && typeof e.label === 'string';
    }
    // The route.length > 0 invariant is what filters any stale pre-v1.3.0
    // theme-action entry (id `nav` + `:theme`, joined) — it had route: '' and
    // migrated to the commands registry (which doesn't write RECENT at all).
    // Don't relax this check without auditing the cmdk-recent migration story.
    case 'navigate': {
      return (
        typeof e.route === 'string' &&
        e.route.length > 0 &&
        typeof e.labelKey === 'string' &&
        e.labelKey.length > 0 &&
        typeof e.icon === 'string' &&
        e.icon.length > 0
      );
    }
    default: {
      return false;
    }
  }
}

function loadSearchQueryType(): SearchMode {
  if (!browser) {
    return 'smart';
  }
  try {
    const stored = localStorage.getItem('searchQueryType');
    if (stored && VALID_MODES.has(stored as SearchMode)) {
      return stored as SearchMode;
    }
    if (stored !== null) {
      localStorage.setItem('searchQueryType', 'smart');
    }
  } catch {
    // localStorage unavailable (privacy mode, SSR shim throwing) — fall through
  }
  return 'smart';
}

function hasSerializableFilters(filters: FilterState | undefined): boolean {
  return (
    filters !== undefined &&
    (filters.personIds.length > 0 ||
      filters.tagIds.length > 0 ||
      !!filters.city ||
      !!filters.country ||
      !!filters.make ||
      !!filters.model ||
      filters.mediaType !== 'all' ||
      filters.isFavorite !== undefined ||
      filters.rating !== undefined ||
      !!filters.dateAfter ||
      !!filters.dateBefore)
  );
}

export class GlobalSearchManager {
  isOpen = $state(false);
  presentation = $state<SearchPresentation>('modal');
  query = $state('');
  searchSortOrder = $state<SearchablePageSortOrder>('relevance');
  mode = $state<SearchMode>(loadSearchQueryType());
  parsedQuery = $derived<ParsedQuery>(parseScope(this.query));
  scope = $derived<Scope>(this.parsedQuery.scope);
  payload = $derived<string>(this.parsedQuery.payload);
  typedSearchDisplayTokens = $state<TypedSearchDisplayToken[]>([]);
  typedSearchIssues = $state<TypedSearchIssue[]>([]);
  typedSearchChoices = $state<TypedSearchChoice[]>([]);
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  selectedTypedSearchChoices = new Map<string, TypedSearchChoice>();
  typedSearchPlainQuery = $state('');
  activeTypedSearchToken = $state<LiveTypedSearchToken | undefined>();
  liveTypedSearchStatus = $state<LiveTypedSearchStatus>({ status: 'idle' });
  typedSearchCaret = $state<number | null>(null);
  typedSearchComposing = $state(false);
  skipNextLiveTypedSearchForCaret = $state<number | null>(null);
  sections = $state<Sections>({
    photos: idle,
    people: idle,
    places: idle,
    tags: idle,
    albums: idle,
    spaces: idle,
    navigation: idle,
    commands: idle,
  });
  activeItemId = $state<string | null>(null);
  mlHealthy = $state(true);
  /**
   * Monotonic counter bumped on every mid-session mutation of the cmdk-recent
   * store (e.g. `removeRecent`). The component's `recentEntries` $derived reads
   * it so deleting a highlighted entry re-evaluates the derived in the same
   * tick — without it, the DOM would show the deleted row until the palette
   * closed and reopened. The counter value itself is not meaningful; its role
   * is purely to register a reactive dependency on mutations the cmdk-recent
   * store cannot signal on its own (plain functions, not a Svelte store).
   */
  recentsRevision = $state(0);
  /**
   * True while any provider in the current batch (or a mode-switch re-run) is in flight.
   * Drives the progress stripe on the palette header.
   */
  batchInFlight = $state(false);
  /**
   * Set of row ids whose activation is currently in flight. Prevents double-Enter on
   * the same row while an async activation handler (e.g. album/space navigate) is
   * still resolving. Entries added at activation start and removed when the handler
   * settles (or the palette closes).
   */
  activationInFlight: SvelteSet<string> = $state(new SvelteSet());
  /**
   * Per-command single-flight guard. Independent of `activationInFlight` (which
   * tracks entity row activations). Prevents a rapid double-Enter from firing
   * Upload's file picker twice or opening two Create-Album modals.
   *
   * Plain `Set` (not `SvelteSet`) because no UI subscribes to this — it's read
   * only inside `activate('command')` for the synchronous has/add check.
   */
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  private commandInFlight: Set<string> = new Set();

  private clearQueryOnNextModalOpen = false;
  /**
   * Id of the row currently showing the 200 ms "pending" affordance (subtle spinner
   * on the row) while its activation handler is resolving. Null when no activation is
   * pending. Separate from `activationInFlight` because the affordance is delayed —
   * only shown when the handler takes longer than 200 ms — while the double-Enter
   * guard is immediate.
   */
  pendingActivation: string | null = $state(null);
  /**
   * Id of the command currently awaiting second-Enter confirmation (v1.4 destructive
   * commands). Null otherwise. Cleared by `cancelConfirm` (query change, selection
   * change, Escape, palette close, 3s timeout) or by the second Enter that fires the
   * command.
   */
  pendingConfirmId: string | null = $state(null);
  private confirmTimer: ReturnType<typeof setTimeout> | null = null;

  protected providers: Record<keyof Sections, Provider>;
  protected debounceTimer: ReturnType<typeof setTimeout> | null = null;
  protected batchController: AbortController | null = null;
  protected photosController: AbortController | null = null;
  private liveTypedSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private liveTypedSearchController: AbortController | null = null;
  private liveTypedSearchRequestId = 0;
  /**
   * Aborted on `close()`, replaced with a fresh controller on `open()`. Scoped to the
   * open-session lifetime — activation-dispatch and catalog fetches (later tasks) bind
   * to `closeSignal` so closing the palette cancels their long-lived work without
   * disrupting the per-keystroke `batchController` fan-out.
   */
  private closeController = new AbortController();
  get closeSignal() {
    return this.closeController.signal;
  }
  /**
   * Count of providers currently in flight. runBatch resets this at entry so a stale
   * batch's decrements cannot corrupt the new batch's bookkeeping (onSettle checks
   * `batch !== this.batchController` before decrementing — see the stale-batch guard).
   */
  private inFlightCounter = 0;
  /**
   * When the current batchInFlight window started (performance.now()). Set by runBatch
   * at debounce-fire time, not setQuery time — the debounce would eat most of the
   * component-side 200ms grace window otherwise.
   */
  private _batchInFlightStartedAt = 0;
  get batchInFlightStartedAt() {
    return this._batchInFlightStartedAt;
  }

  private tagsCache: TagResponseDto[] | null = null;
  private tagsDisabled = false;
  private storageListener?: (e: StorageEvent) => void;
  private mlProbed = false;
  private keepOpenOnNextNavigate = false;
  private searchablePageFiltersProvider?: () => FilterState | undefined;

  /**
   * Catalogs fetched lazily on first provider run and shared for the remainder of the
   * open session. Bound to `closeSignal` so closing the palette cancels in-flight work;
   * the promise fields are reset on `open()` so a prior rejected fetch does not
   * short-circuit the next session's retry.
   */
  albumsCache: AlbumNameDto[] | undefined = $state(undefined);
  spacesCache: SharedSpaceResponseDto[] | undefined = $state(undefined);
  peopleSuggestionsCache: PersonResponseDto[] | undefined = $state(undefined);
  private albumsPromise: Promise<void> | undefined;
  private spacesPromise: Promise<void> | undefined;
  private peoplePromise: Promise<void> | undefined;

  /**
   * Locale-keyed memo cache for navigation item search strings.
   * Keys: locale code (e.g. 'en'). Values: Map<navItemId, searchableString> where
   * searchableString is `${label} ${description}`. Rebuilt on locale change.
   */
  // SvelteMap used per the svelte/prefer-svelte-reactivity lint rule. This is a
  // non-reactive memoization cache — the reactivity machinery isn't needed here, but
  // using the Svelte-aware type keeps the rule happy and has negligible overhead.
  private navigationSearchCache: SvelteMap<string, SvelteMap<string, string>> = new SvelteMap();
  /**
   * Locale-keyed memo cache for command item search strings. Mirrors
   * `navigationSearchCache` — rebuilt on locale change, invalidated via the
   * locale subscribe in the constructor.
   */
  private commandSearchCache: SvelteMap<string, SvelteMap<string, string>> = new SvelteMap();
  private localeUnsubscribe?: () => void;

  constructor() {
    this.providers = this.buildProviders();
    if (browser) {
      this.storageListener = (e) => {
        if (e.key === 'cmdk.tags.version') {
          this.tagsCache = null;
        }
      };
      globalThis.addEventListener('storage', this.storageListener);

      // Invalidate the navigation search cache when the locale changes.
      // The unsubscribe handle is stored on `this.localeUnsubscribe` for test isolation.
      // In production it is never called — the singleton lives for the tab's lifetime.
      this.localeUnsubscribe = i18nLocale.subscribe(() => {
        this.navigationSearchCache.clear();
        this.commandSearchCache.clear();
      });
    }
  }

  destroy() {
    if (this.storageListener) {
      globalThis.removeEventListener('storage', this.storageListener);
    }
    if (this.localeUnsubscribe) {
      this.localeUnsubscribe();
    }
  }

  /**
   * Build or fetch the memoized search-string table for the current locale. Called
   * synchronously from runNavigationProvider. O(1) cache hit; O(NAVIGATION_ITEMS.length)
   * rebuild on locale change or first call.
   */
  private getNavigationSearchStrings(): SvelteMap<string, string> {
    const currentLocale = (get(i18nLocale) ?? 'en') as string;
    const cached = this.navigationSearchCache.get(currentLocale);
    if (cached) {
      return cached;
    }
    const translate = get(t);
    const table = new SvelteMap<string, string>();
    for (const item of NAVIGATION_ITEMS) {
      // labelKey/descriptionKey are typed `string` on NavigationItem but every value is a
      // valid i18n key generated at build time — cast to Translations to satisfy the
      // Gallery-augmented MessageFormatter signature.
      const label = translate(item.labelKey as Translations);
      const description = translate(item.descriptionKey as Translations);
      table.set(item.id, `${label} ${description}`);
    }
    this.navigationSearchCache.set(currentLocale, table);
    return table;
  }

  /**
   * Build or fetch the memoized search-string table for command items in the
   * current locale. Mirrors `getNavigationSearchStrings` — O(1) cache hit,
   * O(COMMAND_ITEMS.length) rebuild on locale change or first call.
   */
  private getCommandSearchStrings(): SvelteMap<string, string> {
    const currentLocale = (get(i18nLocale) ?? 'en') as string;
    const cached = this.commandSearchCache.get(currentLocale);
    if (cached) {
      return cached;
    }
    const translate = get(t);
    const table = new SvelteMap<string, string>();
    for (const item of COMMAND_ITEMS) {
      const label = translate(item.labelKey as Translations);
      const description = translate(item.descriptionKey as Translations);
      table.set(item.id, `${label} ${description}`);
    }
    this.commandSearchCache.set(currentLocale, table);
    return table;
  }

  /**
   * Shared admin/feature-flag filter + fuzzy-score pass for navigation AND command items.
   * Two thin wrappers (`runNavigationProvider` / `runCommandsProvider`) slice the result
   * into their respective sections. Keeps the scoring pass and the scope semantics in a
   * single place so the two providers cannot drift.
   *
   * Scope semantics (identical for both output arrays):
   *   - 'people' | 'tags' | 'collections' — both arrays empty.
   *   - 'all' + empty payload — both arrays empty (no results on bare palette).
   *   - 'nav' + empty payload — bare `>`: return ALL eligible items sorted alphabetically
   *     by translated label (no slice, no scoring).
   *   - 'all' or 'nav' + non-empty payload — fuzzy search payload over eligible items.
   */
  private filterNavAndCommands(
    payload: string,
    scope: Scope,
  ): { commands: CommandItem[]; navigation: NavigationItem[] } {
    if (scope !== 'all' && scope !== 'nav') {
      return { commands: [], navigation: [] };
    }
    if (scope === 'all' && payload === '') {
      return { commands: [], navigation: [] };
    }

    const u = authManager.authenticated ? authManager.user : undefined;
    const isAdmin = u?.isAdmin ?? false;
    const flags = featureFlagsManager.valueOrUndefined;

    const eligibleNav: NavigationItem[] = [];
    for (const item of NAVIGATION_ITEMS) {
      if (item.adminOnly && !isAdmin) {
        continue;
      }
      if (item.featureFlag && !flags?.[item.featureFlag]) {
        continue;
      }
      eligibleNav.push(item);
    }

    const ctx = commandContextManager.getContext();
    const eligibleCmd: CommandItem[] = [];
    for (const item of COMMAND_ITEMS) {
      if (item.adminOnly && !isAdmin) {
        continue;
      }
      if (item.featureFlag && !flags?.[item.featureFlag]) {
        continue;
      }
      if (item.isAvailable) {
        try {
          if (!item.isAvailable(ctx)) {
            continue;
          }
        } catch (error) {
          console.error('[cmdk] isAvailable threw', { id: item.id, error });
          continue;
        }
      }
      eligibleCmd.push(item);
    }

    const translate = get(t);

    // Bare `>` (scope 'nav', empty payload): return both arrays sorted alphabetically
    // by translated label. Commands section gets its own slice below.
    if (scope === 'nav' && payload === '') {
      const sortByLabel = <T extends { labelKey: string }>(a: T, b: T) =>
        translate(a.labelKey as Translations).localeCompare(translate(b.labelKey as Translations));
      return {
        commands: [...eligibleCmd].sort(sortByLabel),
        navigation: [...eligibleNav].sort(sortByLabel),
      };
    }

    // Non-empty payload under 'all' or 'nav': fuzzy score both arrays.
    const navSearch = this.getNavigationSearchStrings();
    const scoredNav: Array<{ item: NavigationItem; score: number }> = [];
    for (const item of eligibleNav) {
      const corpus = navSearch.get(item.id);
      if (!corpus) {
        continue;
      }
      const score = computeCommandScore(corpus, payload);
      if (score <= 0) {
        continue;
      }
      scoredNav.push({ item, score });
    }
    scoredNav.sort((a, b) => b.score - a.score);

    const cmdSearch = this.getCommandSearchStrings();
    const scoredCmd: Array<{ item: CommandItem; score: number }> = [];
    for (const item of eligibleCmd) {
      const corpus = cmdSearch.get(item.id);
      if (!corpus) {
        continue;
      }
      const score = computeCommandScore(corpus, payload);
      if (score <= 0) {
        continue;
      }
      scoredCmd.push({ item, score });
    }
    scoredCmd.sort((a, b) => b.score - a.score);

    return {
      commands: scoredCmd.map((s) => s.item),
      navigation: scoredNav.map((s) => s.item),
    };
  }

  /**
   * Synchronously filter NAVIGATION_ITEMS for a payload under a given scope. Thin wrapper
   * around `filterNavAndCommands` that slices the navigation array to `providers.navigation.topN`.
   * Runs on every keystroke off the main path — bypasses the 150 ms debounce.
   */
  private runNavigationProvider(payload: string, scope: Scope): ProviderStatus<NavigationItem> {
    const { navigation } = this.filterNavAndCommands(payload, scope);
    if (navigation.length === 0) {
      return { status: 'empty' };
    }
    // Bare `>` returns the full filtered catalog unsliced — the design treats the
    // prefix as "open the full nav index". Only the fuzzy-score branch (non-empty
    // payload under scope 'all' / 'nav') slices to topN to keep the section bounded.
    if (scope === 'nav' && payload === '') {
      return { status: 'ok', items: navigation, total: navigation.length };
    }
    const topN = this.providers.navigation.topN;
    return { status: 'ok', items: navigation.slice(0, topN), total: navigation.length };
  }

  /**
   * Synchronously filter COMMAND_ITEMS for a payload under a given scope. Thin wrapper
   * around `filterNavAndCommands` that slices to `providers.commands.topN` and omits
   * any command that has already been promoted to the top-result slot so the row does
   * not render in both places (same dedup the component applies for nav).
   */
  private runCommandsProvider(
    payload: string,
    scope: Scope,
    promotedCommandId: string | null,
  ): ProviderStatus<CommandItem> {
    const { commands } = this.filterNavAndCommands(payload, scope);
    const filtered = promotedCommandId === null ? commands : commands.filter((c) => c.id !== promotedCommandId);
    if (filtered.length === 0) {
      return { status: 'empty' };
    }
    // Bare `>` returns the full filtered catalog unsliced — mirrors navigation's
    // treatment of the prefix as "open the full command index". Only the fuzzy
    // branch (non-empty payload) slices to topN.
    if (scope === 'nav' && payload === '') {
      return { status: 'ok', items: filtered, total: filtered.length };
    }
    const topN = this.providers.commands.topN;
    return { status: 'ok', items: filtered.slice(0, topN), total: filtered.length };
  }

  open(presentation: SearchPresentation = 'modal') {
    this.isOpen = true;
    this.presentation = presentation;
    const currentPageSearchState = getSearchablePageState(page.url);
    const typedDisplayText = currentPageSearchState.isSearchable
      ? getTypedSearchDisplayText(page.url.pathname + page.url.search)
      : undefined;
    if (presentation === 'modal' && this.clearQueryOnNextModalOpen) {
      this.query = '';
      this.searchSortOrder = 'relevance';
      this.clearQueryOnNextModalOpen = false;
    } else if (currentPageSearchState.isSearchable) {
      this.query = typedDisplayText ?? currentPageSearchState.query;
      this.searchSortOrder = currentPageSearchState.query ? currentPageSearchState.sortOrder : 'relevance';
      if (typedDisplayText !== undefined) {
        this.clearQueryOnNextModalOpen = false;
      }
      this.parseTypedSearchDraft(this.query);
    } else {
      this.query = '';
      this.searchSortOrder = 'relevance';
      this.clearTypedSearchDraft();
    }
    if (this.closeController.signal.aborted) {
      this.closeController = new AbortController();
    }
    // Clear any stale promise from the previous session. Without this, a rejected
    // fetch in session N would permanently short-circuit ensureAlbumsCache() in
    // session N+1 (the rejected promise is still memoized in albumsPromise).
    this.albumsPromise = undefined;
    this.spacesPromise = undefined;
    // People suggestions: reset both cache AND promise. Unlike albums/spaces where
    // the cache persists across sessions (low churn, expensive to re-fetch), people
    // can change frequently (renames, hides, new faces) so a fresh getAllPeople is
    // worth the round-trip each time the palette opens.
    this.peopleSuggestionsCache = undefined;
    this.peoplePromise = undefined;
    if (!this.mlProbed) {
      this.mlProbed = true;
      void this.probeMlHealth();
    }
  }

  private async probeMlHealth() {
    try {
      const result = await getMlHealth();
      // If the palette was closed while the probe was in flight, discard the result.
      // Otherwise a slow probe could flip mlHealthy on a hidden manager and corrupt
      // the next-open state.
      if (!this.isOpen) {
        return;
      }
      this.mlHealthy = result.smartSearchHealthy;
    } catch {
      // Retroactive promotion (onPhotosSettled) handles mid-session failure.
    }
  }

  /**
   * Fetch (and memoize) the albums catalog for the current open session. Callers
   * should `await` this before scoring so the cache is populated. Safe to call
   * concurrently — all callers join the same in-flight promise.
   */
  async ensureAlbumsCache(): Promise<void> {
    if (this.albumsCache !== undefined) {
      return;
    }
    if (this.albumsPromise === undefined) {
      this.albumsPromise = this.fetchAlbumsCatalog();
    }
    return this.albumsPromise;
  }

  /**
   * Fetch `GET /albums/names` and dedupe the concatenated owned+shared response by
   * album id, preferring the `shared: true` record when both variants are present.
   * On AbortError (palette closed mid-fetch) the section status stays untouched so
   * reopening the palette is a clean slate; other errors flip the section to
   * `'error'` and rethrow so the caller sees the failure.
   */
  private async fetchAlbumsCatalog(): Promise<void> {
    try {
      const response = await getAlbumNames({ signal: this.closeSignal });
      // SvelteMap instead of plain Map to satisfy the `svelte/prefer-svelte-reactivity`
      // ESLint rule — it flags any Map instance inside .svelte.ts files regardless of
      // whether it's reactive state. This is a local dedupe accumulator; the SvelteMap
      // reactivity overhead is negligible at this scale.
      const byId = new SvelteMap<string, AlbumNameDto>();
      for (const record of response) {
        const existing = byId.get(record.id);
        if (existing === undefined || (record.shared && !existing.shared)) {
          byId.set(record.id, record);
        }
      }
      this.albumsCache = [...byId.values()];
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      this.sections.albums = { status: 'error', message: error instanceof Error ? error.message : 'unknown error' };
      throw error;
    }
  }

  /**
   * Fetch (and memoize) the shared-spaces catalog for the current open session.
   * Mirrors `ensureAlbumsCache()` — callers join a shared in-flight promise.
   */
  async ensureSpacesCache(): Promise<void> {
    if (this.spacesCache !== undefined) {
      return;
    }
    if (this.spacesPromise === undefined) {
      this.spacesPromise = this.fetchSpacesCatalog();
    }
    return this.spacesPromise;
  }

  private async fetchSpacesCatalog(): Promise<void> {
    try {
      this.spacesCache = await getAllSpaces({ signal: this.closeSignal });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      this.sections.spaces = { status: 'error', message: error instanceof Error ? error.message : 'unknown error' };
      throw error;
    }
  }

  /**
   * Fetch (and memoize) the bare-`@` suggestions list for the current open session.
   * Mirrors `ensureAlbumsCache()` / `ensureSpacesCache()` — callers join a shared
   * in-flight promise so rapid retype cycles never start a second fetch.
   */
  async ensurePeopleSuggestionsCache(): Promise<void> {
    if (this.peopleSuggestionsCache !== undefined) {
      return;
    }
    if (this.peoplePromise === undefined) {
      this.peoplePromise = this.fetchPeopleSuggestions();
    }
    return this.peoplePromise;
  }

  private async fetchPeopleSuggestions(): Promise<void> {
    // Per-request timeout on top of closeSignal. Bare-@ flows through
    // ensurePeopleSuggestionsCache, which is independent of the per-keystroke
    // batchController.signal — without this timeout a stuck fetch would leave
    // the section in 'loading' forever until the palette closes.
    const signal = AbortSignal.any([this.closeSignal, AbortSignal.timeout(PROVIDER_TIMEOUT_MS)]);
    try {
      const response = await getAllPeople({ size: 10, withSharedSpaces: true }, { signal });
      this.peopleSuggestionsCache = [...response.people].sort(personSuggestionsComparator);
    } catch (error: unknown) {
      // Distinguish three rejection modes:
      //   1. Timeout: the composite signal aborted with a TimeoutError reason. Surface
      //      'timeout' to the section only if the manager is still at bare-@.
      //   2. Close: the composite signal aborted because of closeSignal. Silent drop —
      //      the palette is going away and the next open() resets the cache fields.
      //   3. Other (network / 5xx / JSON parse): surface 'error' if still at bare-@,
      //      otherwise silently drop so a late rejection can't stomp a fresh
      //      searchPerson result that already wrote 'ok'.
      // Check signal.reason first because fetch() rejections can present as
      // AbortError (browser fetch), TimeoutError (direct signal-driven reject in tests),
      // or DOMException either way — signal.reason is the single source of truth.
      const isTimeout =
        signal.aborted && signal.reason instanceof DOMException && signal.reason.name === 'TimeoutError';
      const isClose = signal.aborted && !isTimeout;
      if (isTimeout) {
        if (this.scope === 'people' && this.payload === '') {
          this.sections.people = { status: 'timeout' };
        }
        return;
      }
      if (isClose) {
        return;
      }
      // Stale-rejection guard: only surface an error if the manager is still in the
      // bare-@ state this fetch was kicked off for. Otherwise the user has typed on
      // and a fresh searchPerson result must not be stomped by a late rejection.
      if (this.scope === 'people' && this.payload === '') {
        this.sections.people = { status: 'error', message: error instanceof Error ? error.message : 'unknown error' };
      }
      throw error;
    }
  }

  /**
   * Resolve an album id through the SDK, write a fresh RECENT entry, and navigate.
   * All guards live here so every Enter-on-row path — fresh result, RECENT, almost-
   * exact nav promotion — routes through a single handler with uniform semantics.
   *
   * Guards:
   *  - Double-Enter: a second call for the same key is a no-op while the first is
   *    still resolving. Cleared in `finally` so retry after settlement works.
   *  - Escape-during-resolve: activation binds to `closeSignal`, so `close()` aborts
   *    the fetch and the post-await `aborted` check short-circuits the navigate.
   *  - Batch rotation does NOT affect activation. The per-keystroke
   *    `batchController` owns the fan-out providers; activation survives typing.
   *  - 400 / 404 / 403: treat as "stale cache" — toast + purge the RECENT (no-op
   *    if absent) so the next open does not re-show a dead row. Gallery's server
   *    `requireAccess` middleware returns 400 (BadRequestException) for both
   *    "row missing" and "no access", so 400 sits alongside the canonical 404/403.
   *  - 401 and other statuses propagate unchanged to the global SDK auth
   *    interceptor (redirect-to-login lives there, not here).
   *  - Pending affordance: the 200 ms `pendingActivation` flag is cleared in
   *    `finally` regardless of which branch settled the activation.
   */
  async activateAlbum(id: string) {
    const key = `album:${id}`;
    if (this.activationInFlight.has(key)) {
      return;
    }
    this.activationInFlight.add(key);

    const pendingTimer = setTimeout(() => {
      this.pendingActivation = key;
    }, 200);

    try {
      const album = await getAlbumInfo({ id }, { signal: this.closeSignal });
      if (this.closeSignal.aborted) {
        return;
      }
      addEntry({
        kind: 'album',
        id: key,
        albumId: id,
        label: album.albumName,
        thumbnailAssetId: album.albumThumbnailAssetId,
        lastUsed: Date.now(),
      });
      void goto(Route.viewAlbum({ id }));
      // Dismiss the palette after handing off to the router. goto is fire-and-forget
      // so navigation and palette close happen in parallel — matches v1's activate()
      // pattern for other kinds (photo/person/place/tag/nav all close post-navigate).
      // Intentionally only on the happy path: the stale-entry (400/403/404) branch
      // leaves the palette open so the user sees the toast and the purged RECENT.
      this.close();
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      const status = (error as { status?: number } | null)?.status;
      if (status === 400 || status === 404 || status === 403) {
        removeEntry(key);
        toastManager.warning(get(t)('cmdk_toast_album_unavailable'));
        return;
      }
      throw error;
    } finally {
      clearTimeout(pendingTimer);
      this.activationInFlight.delete(key);
      if (this.pendingActivation === key) {
        this.pendingActivation = null;
      }
    }
  }

  /**
   * Resolve a space id through the SDK, write a fresh RECENT entry, and navigate.
   * Mirrors `activateAlbum` — same guard set, just swapped for the space-shaped
   * SDK call, route helper, and recent entry. The design doc explicitly defers
   * factoring the two into a generic helper until a future YAGNI follow-up.
   *
   * Guards:
   *  - Double-Enter: a second call for the same key is a no-op while the first is
   *    still resolving. Cleared in `finally` so retry after settlement works.
   *  - Escape-during-resolve: activation binds to `closeSignal`, so `close()` aborts
   *    the fetch and the post-await `aborted` check short-circuits the navigate.
   *  - Batch rotation does NOT affect activation. The per-keystroke
   *    `batchController` owns the fan-out providers; activation survives typing.
   *  - 400 / 404 / 403: treat as "stale cache" — toast + purge the RECENT (no-op
   *    if absent) so the next open does not re-show a dead row. Gallery's server
   *    `requireAccess` middleware returns 400 (BadRequestException) for both
   *    "row missing" and "no access", so 400 sits alongside the canonical 404/403.
   *  - 401 and other statuses propagate unchanged to the global SDK auth
   *    interceptor (redirect-to-login lives there, not here).
   *  - Pending affordance: the 200 ms `pendingActivation` flag is cleared in
   *    `finally` regardless of which branch settled the activation.
   */
  async activateSpace(id: string) {
    const key = `space:${id}`;
    if (this.activationInFlight.has(key)) {
      return;
    }
    this.activationInFlight.add(key);

    const pendingTimer = setTimeout(() => {
      this.pendingActivation = key;
    }, 200);

    try {
      const space = await getSpace({ id }, { signal: this.closeSignal });
      if (this.closeSignal.aborted) {
        return;
      }
      addEntry({
        kind: 'space',
        id: key,
        spaceId: id,
        label: space.name,
        colorHex: space.color ?? null,
        lastUsed: Date.now(),
      });
      void goto(Route.viewSpace({ id }));
      // See activateAlbum for rationale — close after goto, happy path only.
      this.close();
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      const status = (error as { status?: number } | null)?.status;
      if (status === 400 || status === 404 || status === 403) {
        removeEntry(key);
        toastManager.warning(get(t)('cmdk_toast_space_unavailable'));
        return;
      }
      throw error;
    } finally {
      clearTimeout(pendingTimer);
      this.activationInFlight.delete(key);
      if (this.pendingActivation === key) {
        this.pendingActivation = null;
      }
    }
  }

  /**
   * Arm the destructive-confirm state machine. Private — only `activate('command')`
   * calls this when a command with `destructive: true` is fired the first time.
   * Sets pending and schedules a 3s auto-cancel guarded against stale timers.
   */
  private startConfirm(cmdId: string) {
    this.pendingConfirmId = cmdId;
    if (this.confirmTimer !== null) {
      clearTimeout(this.confirmTimer);
    }
    this.confirmTimer = setTimeout(() => {
      if (this.pendingConfirmId === cmdId) {
        this.pendingConfirmId = null;
      }
      this.confirmTimer = null;
    }, 3000);
  }

  /**
   * Clear any armed destructive-confirm. Public — called from setQuery, setActiveItem,
   * `close()`, and the Escape handler in `global-search.svelte`.
   */
  cancelConfirm() {
    if (this.confirmTimer !== null) {
      clearTimeout(this.confirmTimer);
      this.confirmTimer = null;
    }
    this.pendingConfirmId = null;
  }

  close() {
    this.cancelConfirm();
    this.isOpen = false;
    this.presentation = 'modal';
    this.keepOpenOnNextNavigate = false;
    this.closeController.abort();
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = null;
    this.batchController?.abort();
    this.batchController = null;
    this.photosController?.abort();
    this.photosController = null;
    this.clearLiveTypedSearchRequest();
    this.liveTypedSearchRequestId++;
    this.sections = {
      photos: idle,
      people: idle,
      places: idle,
      tags: idle,
      albums: idle,
      spaces: idle,
      navigation: idle,
      commands: idle,
    };
    this.activeItemId = null;
    this.tagsCache = null;
    // Clear batch bookkeeping. Without this, closing mid-batch leaves batchInFlight=true
    // (the stale-batch guard in onSettle prevents stale decrements, so counter never
    // returns to zero naturally) which would flash the progress stripe on reopen.
    this.batchInFlight = false;
    this.inFlightCounter = 0;
    this._batchInFlightStartedAt = 0;
    // Reset query so reopening and re-typing the same string is not a no-op
    // (setQuery short-circuits when `this.query === text`).
    this.query = '';
    this.clearTypedSearchDraft();
    this.searchSortOrder = 'relevance';
  }

  consumeKeepOpenOnNextNavigate() {
    const shouldKeepOpen = this.keepOpenOnNextNavigate;
    this.keepOpenOnNextNavigate = false;
    return shouldKeepOpen;
  }

  toggle(presentation: SearchPresentation = 'modal') {
    if (this.isOpen && this.presentation === presentation) {
      this.close();
    } else {
      this.open(presentation);
    }
  }

  setActiveItem(id: string | null) {
    if (this.pendingConfirmId !== null && id !== this.pendingConfirmId) {
      // Arrowing away from a pending destructive row reverts the red state. Arrowing
      // back (id === pendingConfirmId) leaves pending intact.
      this.cancelConfirm();
    }
    this.activeItemId = id;
  }

  getActiveItem(): ActiveItem | null {
    const id = this.activeItemId;
    if (!id) {
      return null;
    }
    // Empty-query branch: the list is showing recents, not live section results. If
    // the active id matches a recent entry, synthesize a lightweight preview payload
    // from its stored fields. Fall through to the section lookup below if no recent
    // matches — that path is still used by direct-state tests that poke sections with
    // an empty query.
    if (this.query.trim() === '') {
      const entry = getEntries().find((e) => e.id === id);
      if (entry) {
        return this.activeItemFromRecent(entry);
      }
    }
    const liveActiveItem = this.activeItemFromLiveTypedChoice(id);
    if (liveActiveItem) {
      return liveActiveItem;
    }
    // Navigation item IDs are themselves prefixed `nav:...` so the split-on-first-colon
    // trick is inverted: the whole id is the cursor value, and the kind prefix is the
    // string BEFORE the first colon. For nav items, the "kind prefix" is literally `nav`.
    const colon = id.indexOf(':');
    if (colon === -1) {
      return null;
    }
    const kind = id.slice(0, colon);
    const rest = id.slice(colon + 1);
    const section = this.sectionForKind(kind);
    if (!section || section.status !== 'ok') {
      return null;
    }

    if (kind === 'nav') {
      // For navigation items, the activeItemId IS the full NavigationItem.id (e.g.
      // `nav:userPages:photos`, `nav:systemSettings:classification`). Match on the full id.
      const navItems = section.items as NavigationItem[];
      const navMatch = navItems.find((n) => n.id === id);
      return navMatch ? { kind: 'nav', data: navMatch } : null;
    }

    const items = section.items as Array<{ id?: string; latitude?: number; longitude?: number }>;
    const match = items.find((it) => {
      if (it.id !== undefined) {
        return it.id === rest;
      }
      if (kind === 'place' && it.latitude !== undefined && it.longitude !== undefined) {
        return `${it.latitude.toFixed(4)}:${it.longitude.toFixed(4)}` === rest;
      }
      return false;
    });
    if (!match) {
      return null;
    }
    // kind is narrowed by sectionForKind — only the entity kinds below can reach
    // here (nav is handled in the branch above, unknown kinds return null via
    // `sectionForKind`). Cast is split into an intermediate union so album/space
    // carry their DTO types through to the ActiveItem union without forcing the
    // structural entity match through `as unknown`.
    return {
      kind: kind as 'photo' | 'person' | 'place' | 'tag' | 'album' | 'space',
      data: match,
    } as ActiveItem;
  }

  private activeItemFromLiveTypedChoice(id: string): ActiveItem | null {
    const status = this.liveTypedSearchStatus;
    if (!id.startsWith('filter:') || status.status !== 'ok') {
      return null;
    }

    const choice = status.items.find((item) => liveTypedSearchChoiceValue(item) === id);
    const preview = choice?.preview;
    if (!preview) {
      return null;
    }

    if (preview.kind === 'person') {
      return { kind: 'person', data: preview.data };
    }

    if (preview.kind === 'tag') {
      return { kind: 'tag', data: preview.data };
    }

    return null;
  }

  /**
   * Build a lightweight ActiveItem from a RecentEntry. Recent entries only store the
   * minimum fields needed for row rendering (id, label, a thumbnail hint), not the
   * full API DTO — so the resulting preview payload is intentionally sparse. The per-
   * kind preview components tolerate missing fields via optional chaining.
   *
   *   - photo/person/place/tag → return a `{ kind, data }` pair suitable for their
   *     existing preview components.
   *   - query/navigate → no preview (nothing interesting to show beyond the row itself).
   */
  private activeItemFromRecent(entry: RecentEntry): ActiveItem | null {
    switch (entry.kind) {
      case 'photo': {
        return {
          kind: 'photo',
          data: { id: entry.assetId, originalFileName: entry.label } as unknown,
        };
      }
      case 'person': {
        return {
          kind: 'person',
          data: {
            id: entry.personId,
            name: entry.label,
          } as unknown,
        };
      }
      case 'place': {
        return {
          kind: 'place',
          data: { name: entry.label, latitude: entry.latitude, longitude: entry.longitude } as unknown,
        };
      }
      case 'tag': {
        return {
          kind: 'tag',
          data: { id: entry.tagId, name: entry.label } as unknown,
        };
      }
      case 'query':
      case 'album':
      case 'space':
      case 'navigate': {
        return null;
      }
      // No 'command' case: commands are verbs, not destinations. activate('command')
      // does not call addEntry, so no RecentEntry with a cmd:* id can exist. If one
      // ever appears, isValidRecentEntry's kind-specific field checks discard it
      // silently on read.
    }
  }

  private sectionForKind(kind: string): ProviderStatus<unknown> | null {
    switch (kind) {
      case 'photo': {
        return this.sections.photos;
      }
      case 'person': {
        return this.sections.people;
      }
      case 'place': {
        return this.sections.places;
      }
      case 'tag': {
        return this.sections.tags;
      }
      case 'album': {
        return this.sections.albums;
      }
      case 'space': {
        return this.sections.spaces;
      }
      case 'nav': {
        return this.sections.navigation;
      }
      case 'command': {
        return this.sections.commands;
      }
      default: {
        return null;
      }
    }
  }

  reconcileCursor() {
    if (this.activeItemId === this.topSearchMatch?.id) {
      return;
    }
    if (this.getActiveItem() !== null) {
      return;
    }
    // Scope-aware priority walk. `RECONCILE_ORDER_BY_SCOPE` holds the per-scope
    // priority so the highlight lands on a row the user's active prefix actually
    // surfaces (e.g. under `@` the cursor never jumps to an unrelated photo).
    const order = RECONCILE_ORDER_BY_SCOPE[this.scope];
    const kindOf: Record<keyof Sections, string> = {
      photos: 'photo',
      people: 'person',
      places: 'place',
      tags: 'tag',
      albums: 'album',
      spaces: 'space',
      navigation: 'nav',
      commands: 'command',
    };
    for (const key of order) {
      const s = this.sections[key];
      if (s.status === 'ok' && s.items.length > 0) {
        const first = s.items[0] as { id?: string; latitude?: number; longitude?: number };
        if (first.id !== undefined) {
          // Navigation item IDs are already fully-qualified (`nav:<category>:<slug>`).
          // Other entity IDs are just the raw entity id and need the kind prefix.
          this.activeItemId = key === 'navigation' ? first.id : `${kindOf[key]}:${first.id}`;
          return;
        }
        if (key === 'places' && first.latitude !== undefined && first.longitude !== undefined) {
          this.activeItemId = `place:${first.latitude.toFixed(4)}:${first.longitude.toFixed(4)}`;
          return;
        }
      }
    }
    this.activeItemId = null;
  }

  /**
   * Navigate to a NavigationItem route. If the target's pathname matches the current
   * pathname (only query params differ), SvelteKit's client-side `goto` updates the
   * URL without re-running the page component — URL-backed component state such as
   * `SettingAccordionState` in the system-settings page would then be stuck on its
   * stale initial value. Fall back to a full browser navigation in that case so
   * every component remounts with the fresh URL and re-reads its query params.
   */
  private navigateNav(route: string) {
    if (!browser) {
      return;
    }
    try {
      // Plain URL parsing, not reactive state — the instance is discarded after the
      // pathname comparison. SvelteURL would be overkill here.
      // eslint-disable-next-line svelte/prefer-svelte-reactivity
      const target = new URL(route, globalThis.location.href);
      if (target.pathname === globalThis.location.pathname) {
        globalThis.location.href = route;
        return;
      }
    } catch {
      // Fall through to goto if URL parsing fails.
    }
    void goto(route);
  }

  parseTypedSearchDraft(text = this.query) {
    const parsed = parseTypedSearch(text, { mode: 'draft' });
    this.applyTypedSearchParsedState(parsed);
    this.updateActiveTypedSearchToken();
    return parsed;
  }

  private parseTypedSearchCommit(text: string) {
    const parsed = parseTypedSearch(text);
    this.applyTypedSearchParsedState(parsed);
    return parsed;
  }

  private applyTypedSearchParsedState(parsed: TypedSearchParseResult) {
    this.typedSearchDisplayTokens = parsed.displayTokens;
    this.typedSearchPlainQuery = parsed.queryText;
    this.typedSearchIssues = [];
    this.typedSearchChoices = [];
    for (const key of this.selectedTypedSearchChoices.keys()) {
      if (!parsed.resolutionTokens.some((token) => token.raw === key || token.identity === key)) {
        this.selectedTypedSearchChoices.delete(key);
      }
    }
  }

  clearTypedSearchDraft() {
    this.typedSearchDisplayTokens = [];
    this.typedSearchPlainQuery = '';
    this.typedSearchIssues = [];
    this.typedSearchChoices = [];
    this.selectedTypedSearchChoices.clear();
    this.activeTypedSearchToken = undefined;
    this.typedSearchCaret = null;
    this.skipNextLiveTypedSearchForCaret = null;
    this.clearLiveTypedSearchRequest();
    this.liveTypedSearchRequestId++;
    this.liveTypedSearchStatus = { status: 'idle' };
    this.typedSearchComposing = false;
  }

  setInputCaret(caret: number | null) {
    this.typedSearchCaret = caret;
    this.updateActiveTypedSearchToken();
  }

  setInputComposing(isComposing: boolean) {
    this.typedSearchComposing = isComposing;
    this.updateActiveTypedSearchToken();
  }

  private clearLiveTypedSearchRequest() {
    if (this.liveTypedSearchTimer !== null) {
      clearTimeout(this.liveTypedSearchTimer);
      this.liveTypedSearchTimer = null;
    }
    this.liveTypedSearchController?.abort();
    this.liveTypedSearchController = null;
  }

  private resetLiveTypedSearchSuggestions() {
    this.clearLiveTypedSearchRequest();
    this.liveTypedSearchRequestId++;
    this.liveTypedSearchStatus = { status: 'idle' };
  }

  private scheduleLiveTypedSearchSuggestions() {
    if (!this.activeTypedSearchToken || this.typedSearchComposing) {
      this.resetLiveTypedSearchSuggestions();
      return;
    }
    if (this.skipNextLiveTypedSearchForCaret === this.typedSearchCaret) {
      this.skipNextLiveTypedSearchForCaret = null;
      this.resetLiveTypedSearchSuggestions();
      return;
    }
    const key = this.activeTypedSearchToken.key;
    const supportsLiveSuggestions = key === 'person' || key === 'tag' || key === 'country' || key === 'city';
    if (!supportsLiveSuggestions) {
      this.resetLiveTypedSearchSuggestions();
      return;
    }

    this.clearLiveTypedSearchRequest();
    const requestId = ++this.liveTypedSearchRequestId;
    const token = this.activeTypedSearchToken;
    this.liveTypedSearchStatus = { status: 'loading', key };
    this.liveTypedSearchTimer = setTimeout(() => {
      this.liveTypedSearchTimer = null;
      const controller = new AbortController();
      this.liveTypedSearchController = controller;
      const pathParts = page.url.pathname.split('/').filter(Boolean);
      const spaceId = pathParts[0] === 'spaces' ? pathParts[1] : undefined;
      const signal = AbortSignal.any([this.closeSignal, controller.signal, AbortSignal.timeout(PROVIDER_TIMEOUT_MS)]);

      void Promise.resolve()
        .then(() =>
          resolveLiveTypedSearchSuggestions({
            parsed: parseTypedSearch(this.query, { mode: 'draft' }),
            activeToken: token,
            spaceId,
            signal,
          }),
        )
        .then((status) => {
          if (requestId !== this.liveTypedSearchRequestId) {
            return;
          }
          const isTimeout =
            signal.aborted && signal.reason instanceof DOMException && signal.reason.name === 'TimeoutError';
          if (isTimeout) {
            this.liveTypedSearchStatus = { status: 'timeout', key };
            return;
          }
          if (!signal.aborted) {
            this.liveTypedSearchStatus = status;
            this.reconcileCursor();
          }
        })
        .catch((error: unknown) => {
          const isTimeout =
            (signal.aborted && signal.reason instanceof DOMException && signal.reason.name === 'TimeoutError') ||
            (error instanceof DOMException && error.name === 'TimeoutError');
          if (isTimeout) {
            if (requestId === this.liveTypedSearchRequestId) {
              this.liveTypedSearchStatus = { status: 'timeout', key };
            }
            return;
          }
          if (signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
            return;
          }
          if (requestId === this.liveTypedSearchRequestId) {
            this.liveTypedSearchStatus = {
              status: 'error',
              key,
              message: error instanceof Error ? error.message : 'unknown error',
            };
          }
        })
        .finally(() => {
          if (this.liveTypedSearchController === controller) {
            this.liveTypedSearchController = null;
          }
        });
    }, 150);
  }

  private updateActiveTypedSearchToken() {
    if (this.typedSearchComposing) {
      this.activeTypedSearchToken = undefined;
      this.scheduleLiveTypedSearchSuggestions();
      return;
    }
    const parsed = parseTypedSearch(this.query, { mode: 'draft' });
    const token = getActiveTypedSearchToken(parsed, this.typedSearchCaret);
    const previousToken = this.activeTypedSearchToken;
    const nextToken = isLiveTypedSearchToken(token) && token.issue?.code !== 'unterminated-quote' ? token : undefined;
    const tokenChanged =
      previousToken?.key !== nextToken?.key ||
      previousToken?.start !== nextToken?.start ||
      previousToken?.end !== nextToken?.end ||
      previousToken?.raw !== nextToken?.raw;
    this.activeTypedSearchToken = nextToken;
    if (!this.activeTypedSearchToken || tokenChanged) {
      this.liveTypedSearchStatus = { status: 'idle' };
    }
    this.scheduleLiveTypedSearchSuggestions();
  }

  selectTypedSearchChoice(choice: TypedSearchChoice) {
    this.selectedTypedSearchChoices.set(choice.tokenRaw, choice);
    this.typedSearchIssues = this.typedSearchIssues.filter((issue) => issue.raw !== choice.tokenRaw);
    this.typedSearchChoices = this.typedSearchChoices.filter((item) => item.tokenRaw !== choice.tokenRaw);
    this.typedSearchDisplayTokens = this.typedSearchDisplayTokens.map((token) =>
      token.raw === choice.tokenRaw
        ? { raw: token.raw, key: token.key, value: choice.label, status: 'resolved-entity' as const }
        : token,
    );
  }

  selectLiveTypedSearchChoice(choice: LiveTypedSearchChoice) {
    const activeToken = this.activeTypedSearchToken;
    if (!activeToken) {
      return;
    }
    const { text, caret } = rewriteTypedSearchToken(this.query, activeToken, {
      key: choice.key,
      value: choice.value,
    });
    const needsSeparator = text[caret] === undefined || !/\s/.test(text[caret]);
    const nextText = needsSeparator ? `${text.slice(0, caret)} ${text.slice(caret)}` : text;
    const nextCaret = needsSeparator ? caret + 1 : caret;

    this.setQuery(nextText);
    this.skipNextLiveTypedSearchForCaret = nextCaret;
    this.setInputCaret(nextCaret);
    const parsedAfterRewrite = parseTypedSearch(nextText, { mode: 'draft' });
    const rewrittenToken = getActiveTypedSearchToken(parsedAfterRewrite, caret);
    const selectedChoice = selectedChoiceFromLiveChoice(choice, rewrittenToken);
    if (selectedChoice && rewrittenToken) {
      const tokenKey = getTypedSearchTokenIdentity(
        selectedChoice.key,
        rewrittenToken.start,
        rewrittenToken.end,
        rewrittenToken.raw,
      );
      this.selectedTypedSearchChoices.set(tokenKey, selectedChoice);
    }
    this.resetLiveTypedSearchSuggestions();
  }

  private getSearchProviderPayload(): string {
    if (this.scope !== 'all') {
      return this.payload;
    }
    return this.typedSearchPlainQuery;
  }

  private buildSearchDestination(text: string, filters?: FilterState): string {
    const searchablePageUrl = buildSearchablePageUrl(page.url, text, this.searchSortOrder, filters);
    if (searchablePageUrl) {
      return searchablePageUrl;
    }

    if (page.url.pathname.startsWith('/map') && !hasSerializableFilters(filters)) {
      // Ephemeral serialization for navigation only; no reactive state is retained.
      // eslint-disable-next-line svelte/prefer-svelte-reactivity
      const params = new URLSearchParams(page.url.searchParams);
      params.set('q', text);
      return `/map?${params.toString()}`;
    }

    // Ephemeral URL object for destination construction only; no reactive state is retained.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    return buildSearchablePageUrl(new URL('/photos', page.url), text, this.searchSortOrder, filters) ?? '/photos';
  }

  async applySearchSort(sortOrder: SearchablePageSortOrder, text = this.query) {
    this.searchSortOrder = sortOrder;

    const nextUrl = buildSearchablePageUrl(page.url, text, sortOrder, this.searchablePageFiltersProvider?.());
    if (!nextUrl || nextUrl === page.url.pathname + page.url.search) {
      return;
    }

    this.keepOpenOnNextNavigate = this.isOpen;
    try {
      await goto(nextUrl, {
        replaceState: true,
        keepFocus: true,
        noScroll: true,
      });
    } catch (error) {
      this.keepOpenOnNextNavigate = false;
      throw error;
    }
  }

  registerSearchablePageFilters(provider: () => FilterState | undefined) {
    this.searchablePageFiltersProvider = provider;

    return () => {
      if (this.searchablePageFiltersProvider === provider) {
        this.searchablePageFiltersProvider = undefined;
      }
    };
  }

  async activateSearch(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) {
      const searchablePageUrl = buildSearchablePageUrl(page.url, '');
      if (searchablePageUrl && searchablePageUrl !== page.url.pathname + page.url.search) {
        this.query = '';
        this.searchSortOrder = 'relevance';
        this.clearQueryOnNextModalOpen = false;
        void goto(searchablePageUrl);
      }
      return;
    }

    const parsed = this.parseTypedSearchCommit(trimmed);
    if (parsed.issues.length > 0) {
      this.typedSearchIssues = parsed.issues;
      this.typedSearchChoices = [];
      this.typedSearchDisplayTokens = parsed.displayTokens;
      return;
    }

    const spaceId = page.url.pathname.startsWith('/spaces/')
      ? page.url.pathname.split('/').filter(Boolean)[1]
      : undefined;
    const resolved = await resolveTypedSearchFilters(parsed, {
      spaceId,
      signal: this.closeSignal,
      selectedChoices: this.selectedTypedSearchChoices,
    });

    if (!resolved.ok) {
      this.typedSearchIssues = resolved.issues;
      this.typedSearchChoices = resolved.choices;
      this.typedSearchDisplayTokens = parsed.displayTokens.map((token) => {
        const issue = resolved.issues.find((item) => item.raw === token.raw);
        return issue ? { ...token, status: 'error' as const, issue } : token;
      });
      return;
    }

    this.typedSearchIssues = [];
    this.typedSearchChoices = [];
    addEntry({
      kind: 'query',
      id: `query:${trimmed.toLowerCase()}`,
      text: trimmed,
      lastUsed: Date.now(),
    });
    this.clearQueryOnNextModalOpen = true;
    const destination = this.buildSearchDestination(resolved.queryText, resolved.filters);
    storeTypedSearchNames(destination, { personNames: resolved.personNames, tagNames: resolved.tagNames }, trimmed);
    void goto(destination);
  }

  activate(kind: 'photo' | 'person' | 'place' | 'tag' | 'nav' | 'command', item: unknown) {
    const now = Date.now();
    switch (kind) {
      case 'photo': {
        const p = item as { id: string; originalFileName?: string };
        addEntry({
          kind: 'photo',
          id: `photo:${p.id}`,
          assetId: p.id,
          label: p.originalFileName ?? '',
          lastUsed: now,
        });
        void goto(Route.viewAsset({ id: p.id }));
        break;
      }
      case 'person': {
        const p = item as PersonResponseDto;
        if (p.primaryProfile?.type !== 'space-person') {
          const personId = p.primaryProfile?.id ?? p.id;
          addEntry({
            kind: 'person',
            id: `person:${personId}`,
            personId,
            label: p.name ?? '',
            lastUsed: now,
          });
        }
        void goto(getPersonRoute(p));
        break;
      }
      case 'place': {
        const p = item as { name?: string; latitude: number; longitude: number };
        addEntry({
          kind: 'place',
          id: makePlaceId(p.latitude, p.longitude),
          latitude: p.latitude,
          longitude: p.longitude,
          label: p.name ?? '',
          lastUsed: now,
        });
        void goto(Route.map({ zoom: 12, lat: p.latitude, lng: p.longitude }));
        break;
      }
      case 'tag': {
        const t = item as { id: string; name?: string };
        addEntry({
          kind: 'tag',
          id: `tag:${t.id}`,
          tagId: t.id,
          label: t.name ?? '',
          lastUsed: now,
        });
        void goto(Route.search({ tagIds: [t.id] }));
        break;
      }
      case 'nav': {
        const n = item as NavigationItem;
        addEntry({
          kind: 'navigate',
          id: n.id,
          route: n.route,
          labelKey: n.labelKey,
          icon: n.icon,
          adminOnly: n.adminOnly,
          lastUsed: now,
        });
        this.navigateNav(n.route);
        break;
      }
      case 'command': {
        const cmd = item as CommandItem;

        if (cmd.destructive) {
          if (this.pendingConfirmId === cmd.id) {
            // Second Enter on the armed destructive command — clear pending and fall
            // through to the fire path.
            this.cancelConfirm();
          } else {
            // First Enter (or a different destructive replacing the current pending).
            this.startConfirm(cmd.id);
            return; // do NOT close, do NOT fire
          }
        } else if (this.pendingConfirmId !== null) {
          // User picked a non-destructive row while a destructive was pending.
          // Clear pending and fire the picked command.
          this.cancelConfirm();
        }

        if (this.commandInFlight.has(cmd.id)) {
          return;
        }
        this.commandInFlight.add(cmd.id);
        const ctx = commandContextManager.getContext();
        this.close();
        queueMicrotask(() => {
          void Promise.resolve()
            .then(() => cmd.handler(ctx))
            .catch((error) => console.error('[cmdk] command handler failed', { id: cmd.id, error }))
            .finally(() => this.commandInFlight.delete(cmd.id));
        });
        return; // no RECENT write
      }
    }
    this.close();
  }

  activateRecent(entry: RecentEntry) {
    // Guard against corrupt or truncated entries (user-tampered localStorage, legacy
    // schema from an older version). Missing the kind-specific id fields would cause
    // goto('/photos/undefined') or similar bad URLs, so bail out silently.
    if (!isValidRecentEntry(entry)) {
      console.warn('[cmdk] ignoring corrupt recent entry', entry);
      this.close();
      return;
    }
    // Stale-state re-check for navigate entries. Three failure modes, all treated
    // the same way (warn + purge + close):
    //   1. The navigation item was removed from NAVIGATION_ITEMS (upgrade dropped it).
    //   2. It's adminOnly and the user has been demoted since the recent was saved.
    //   3. It's feature-flag gated and the flag was disabled since the recent was saved.
    // Using the LIVE NavigationItem (not the saved entry fields) ensures we pick up
    // adminOnly / featureFlag / route changes made upstream.
    let liveNavItem: NavigationItem | undefined;
    if (entry.kind === 'navigate') {
      liveNavItem = NAVIGATION_ITEMS.find((n) => n.id === entry.id);
      const isAdmin = (authManager.authenticated ? authManager.user : undefined)?.isAdmin ?? false;
      const flags = featureFlagsManager.valueOrUndefined;
      if (!liveNavItem) {
        console.warn('[cmdk] purging stale recent — unknown nav item', entry.id);
        removeEntry(entry.id);
        this.close();
        return;
      }
      if (liveNavItem.adminOnly && !isAdmin) {
        console.warn('[cmdk] purging stale admin recent', entry.id);
        removeEntry(entry.id);
        this.close();
        return;
      }
      if (liveNavItem.featureFlag && !flags?.[liveNavItem.featureFlag]) {
        console.warn('[cmdk] purging stale recent — feature flag disabled', entry.id);
        removeEntry(entry.id);
        this.close();
        return;
      }
    }
    // Album / space entries route through their dedicated activate methods, which
    // own the SDK round-trip, the addEntry-on-success / removeEntry-on-404,403, the
    // pending-row affordance, and the navigation. Skipping the unconditional
    // addEntry below means a stale entry isn't bumped just before the 404 branch
    // purges it (cleaner store + no flicker) and prevents double-writes on the
    // happy path. We must NOT call this.close() here — it would abort closeSignal
    // and cancel the in-flight fetch. The palette dismissal mirrors the fresh-
    // result activation path (global-search.svelte): rely on the route change to
    // tear down the modal, and on the 404/403 toast branch to leave the palette
    // open so the stale row gets removed in place.
    if (entry.kind === 'album') {
      void this.activateAlbum(entry.albumId);
      return;
    }
    if (entry.kind === 'space') {
      void this.activateSpace(entry.spaceId);
      return;
    }
    if (entry.kind === 'query') {
      void this.activateSearch(entry.text);
      return;
    }
    const now = Date.now();
    addEntry({ ...entry, lastUsed: now });
    switch (entry.kind) {
      case 'photo': {
        void goto(Route.viewAsset({ id: entry.assetId }));
        break;
      }
      case 'person': {
        void goto(Route.viewPerson({ id: entry.personId }));
        break;
      }
      case 'place': {
        void goto(Route.map({ zoom: 12, lat: entry.latitude, lng: entry.longitude }));
        break;
      }
      case 'tag': {
        void goto(Route.search({ tagIds: [entry.tagId] }));
        break;
      }
      case 'navigate': {
        // Use the LIVE NavigationItem route — an upstream rename would otherwise
        // leave the user stranded on a 404 even though we just validated the entry.
        // liveNavItem is guaranteed set here (unknown-item branch returned early),
        // but fall back to entry.route for defensive robustness.
        this.navigateNav(liveNavItem?.route ?? entry.route);
        break;
      }
    }
    this.close();
  }

  /**
   * Removes a recent entry from the cmdk-recent store and re-homes the highlight
   * if the caller deleted the currently-active row. Called from Delete/Backspace
   * key handling and the per-row X button. No-op on unknown ids so a stale cursor
   * from an out-of-date view does not accidentally bump the revision.
   */
  removeRecent(id: string) {
    const before = getEntries();
    if (!before.some((e) => e.id === id)) {
      return;
    }
    removeEntry(id);
    this.recentsRevision++;
    // If the deleted row was the active one, pick the next-newest remaining
    // entry so keyboard users are not stranded on a dead cursor. `getEntries`
    // returns newest-first, and since `id` is guaranteed present in `before`
    // but absent from the post-removal list, we just take the first survivor.
    if (this.activeItemId === id) {
      const next = before.find((e) => e.id !== id);
      this.activeItemId = next?.id ?? null;
    }
  }

  setMode(newMode: SearchMode) {
    if (newMode === this.mode) {
      return;
    }
    this.mode = newMode;
    if (browser) {
      try {
        localStorage.setItem('searchQueryType', newMode);
      } catch {
        // ignore — privacy mode
      }
    }

    // Scope short-circuit: photos isn't dispatched under any prefix, so a mode
    // change under scope has no runtime effect. Mode still persists for next
    // unscoped search.
    if (this.scope !== 'all') {
      return;
    }

    if (this.debounceTimer !== null) {
      this.clearDebounce();
      this.debounceTimer = setTimeout(() => this.runBatch(this.query, this.mode), 150);
      return;
    }
    if (this.query.trim() === '') {
      return;
    }

    // SWR: only flip to loading if the previous photos are not ok.
    if (this.sections.photos.status !== 'ok') {
      this.sections.photos = { status: 'loading' };
    }

    // Capture the batchController at setMode-call time. A stale setMode straggler
    // that resolves AFTER a new runBatch has taken over must not decrement the new
    // batch's counter — same stale-batch-guard pattern as runBatch.onSettle.
    const setModeBatch = this.batchController;

    // Join the in-flight counter so mode switches share bookkeeping with any active
    // main batch. Without this, a mode switch during an active batch would drop the
    // stripe the moment its own photos settle, even though the main batch is still
    // pending.
    this.inFlightCounter++;
    if (!this.batchInFlight) {
      this.batchInFlight = true;
      this._batchInFlightStartedAt = performance.now();
    }

    this.photosController?.abort();
    const photos = new AbortController();
    this.photosController = photos;
    const signal = AbortSignal.any([
      ...(setModeBatch ? [setModeBatch.signal] : []),
      photos.signal,
      AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    ]);

    const onSetModeSettle = () => {
      // Same stale-batch guard as runBatch.onSettle.
      if (this.batchController !== setModeBatch) {
        return;
      }
      this.inFlightCounter--;
      if (this.inFlightCounter === 0) {
        this.batchInFlight = false;
      }
    };

    // Promise.resolve().then(...) guarantees that a provider which synchronously
    // throws (not just returns a rejected promise) still lands in the .catch handler.
    // Symmetric with runBatch's defensive wrapper.
    Promise.resolve()
      .then(() => this.providers.photos.run(this.getSearchProviderPayload(), this.mode, signal))
      .then((result) => {
        if (setModeBatch !== this.batchController) {
          return;
        }
        // Stale setMode race: if a later setMode aborted OUR photosController before
        // we resolved, a newer photos run is already in flight (or has already written
        // fresh results). Skip the write to avoid clobbering the newer data, but still
        // decrement the counter we incremented above.
        if (signal.aborted) {
          onSetModeSettle();
          return;
        }
        // Providers return `ProviderStatus<unknown>` because each one handles its own
        // concrete DTO type internally. The Sections type uses `EntityItem` — a
        // structural superset that every entity DTO (photo/person/place/tag)
        // satisfies. The cast is sound because runBatch's key iteration and the
        // provider contract ensure we never write a NavigationItem here.
        this.sections.photos = result as ProviderStatus<EntityItem>;
        this.onPhotosSettled();
        this.reconcileCursor();
        onSetModeSettle();
      })
      .catch((error: unknown) => {
        if (setModeBatch !== this.batchController) {
          return;
        }
        if (error instanceof Error && error.name === 'AbortError') {
          if (signal.aborted && signal.reason instanceof DOMException && signal.reason.name === 'TimeoutError') {
            this.sections.photos = { status: 'timeout' };
            this.onPhotosSettled();
          }
          onSetModeSettle();
          return;
        }
        this.sections.photos = {
          status: 'error',
          message: error instanceof Error ? error.message : 'unknown error',
        };
        this.onPhotosSettled();
        onSetModeSettle();
      });
  }

  private onPhotosSettled() {
    if (this.mode !== 'smart') {
      return;
    }
    const s = this.sections.photos.status;
    if (s === 'timeout' || s === 'error') {
      this.mlHealthy = false;
    }
  }

  /**
   * Top navigation result — the single most confident nav-item promotion for
   * the current query. Null when the query is empty or when no item's label
   * passes the almost-exact gate. The palette renders this above photos/
   * places/etc. so power users who know the page they want jump straight to
   * it without scrolling past content results.
   *
   * Scans the FULL catalog (filtered by admin + feature flags), not just
   * whatever `sections.navigation` currently holds — cmdk's fuzzy scorer
   * discards items with weak char-overlap even when a compound query contains
   * the literal label word (e.g. `auto-classification` vs `Classification
   * Settings`), and the almost-exact rule is strict enough that scanning the
   * unfiltered catalog is still safe.
   */
  topNavigationMatch = $derived.by<NavigationItem | null>(() => {
    // Top-result promotion is an unscoped feature only — the render path in
    // global-search.svelte gates on `scope === 'all'`. Computing a match under
    // `>` / `@` / `#` / `/` serves no purpose and (for commands) would dedup
    // the promoted item out of its own section, leaving nothing visible.
    if (this.scope !== 'all') {
      return null;
    }
    if (this.typedSearchDisplayTokens.length > 0) {
      return null;
    }
    const q = this.query.trim();
    if (q.length === 0) {
      return null;
    }
    // Command-wins tie-break: if a command is promoted to the top-result slot, nav
    // stays empty for that slot so the two never fight. Commands are high-intent
    // verbs and we want "theme" to fire the toggle, not jump to the settings page.
    if (this.topCommandMatch !== null) {
      return null;
    }
    const isAdmin = (authManager.authenticated ? authManager.user : undefined)?.isAdmin ?? false;
    const flags = featureFlagsManager.valueOrUndefined;
    const translate = get(t);
    for (const item of NAVIGATION_ITEMS) {
      if (item.adminOnly && !isAdmin) {
        continue;
      }
      if (item.featureFlag && !flags?.[item.featureFlag]) {
        continue;
      }
      const label = translate(item.labelKey as Translations);
      if (isAlmostExactNavMatch(q, label)) {
        return item;
      }
    }
    return null;
  });

  topSearchMatch = $derived.by<TopSearchMatch | null>(() => {
    const query = this.query.trim();
    if (this.scope !== 'all' || query.length === 0) {
      return null;
    }
    // The synthetic free-text search row only owns the top slot when there is no
    // stronger promoted command/navigation match. This keeps Enter aligned with the
    // high-confidence command/nav result for queries like `theme` or
    // `auto-classification`.
    if (this.topCommandMatch !== null || this.topNavigationMatch !== null) {
      return null;
    }
    return { id: 'top-search', query: this.typedSearchPlainQuery || query, rawQuery: query };
  });

  /**
   * Top command result — the single most confident command-item promotion for
   * the current query. Null when the query is empty or when no command's label
   * passes the almost-exact gate. Checked BEFORE `topNavigationMatch` so a
   * command like "theme" wins over a same-name nav destination.
   */
  topCommandMatch = $derived.by<CommandItem | null>(() => {
    // See the scope gate in topNavigationMatch. Under `>` scope the command
    // section itself lists matching commands — promoting + deduping here would
    // make the section render empty, so only promote under unscoped 'all'.
    if (this.scope !== 'all') {
      return null;
    }
    if (this.typedSearchDisplayTokens.length > 0) {
      return null;
    }
    const q = this.query.trim();
    if (q.length === 0) {
      return null;
    }
    const isAdmin = (authManager.authenticated ? authManager.user : undefined)?.isAdmin ?? false;
    const flags = featureFlagsManager.valueOrUndefined;
    const translate = get(t);
    const ctx = commandContextManager.getContext();
    const cmdSearch = this.getCommandSearchStrings();
    let best: { item: CommandItem; score: number } | null = null;
    for (const item of COMMAND_ITEMS) {
      if (item.adminOnly && !isAdmin) {
        continue;
      }
      if (item.featureFlag && !flags?.[item.featureFlag]) {
        continue;
      }
      if (item.isAvailable) {
        try {
          if (!item.isAvailable(ctx)) {
            continue;
          }
        } catch (error) {
          console.error('[cmdk] isAvailable threw', { id: item.id, error });
          continue;
        }
      }
      const label = translate(item.labelKey as Translations);
      if (!isAlmostExactCommandMatch(q, label)) {
        continue;
      }
      const corpus = cmdSearch.get(item.id);
      if (!corpus) {
        continue;
      }
      const score = computeCommandScore(corpus, q);
      if (score <= 0) {
        continue;
      }
      if (best === null || score > best.score) {
        best = { item, score };
      }
    }
    return best?.item ?? null;
  });

  announcementText = $derived.by(() => {
    const s = this.sections;
    const allSettled =
      s.photos.status !== 'loading' &&
      s.people.status !== 'loading' &&
      s.places.status !== 'loading' &&
      s.tags.status !== 'loading' &&
      s.albums.status !== 'loading' &&
      s.spaces.status !== 'loading' &&
      s.navigation.status !== 'loading';
    if (!allSettled) {
      return '';
    }
    // Under a prefix scope (e.g. `@alice`, `#xmas`, `/trip`, `>theme`), screen
    // readers announce "Scoped to <section>." before the counts so the user
    // knows the palette is filtered. Scope 'all' stays plain — the cue would
    // be noise on unscoped queries.
    const scopeCue = this.scope === 'all' ? '' : get(t)(`cmdk_announce_scoped_${this.scope}` as Translations);
    const parts: string[] = [];
    const count = (st: ProviderStatus) => (st.status === 'ok' ? st.total : 0);
    if (count(s.photos) > 0) {
      parts.push(`${count(s.photos)} photos`);
    }
    if (count(s.people) > 0) {
      parts.push(`${count(s.people)} people`);
    }
    if (count(s.places) > 0) {
      parts.push(`${count(s.places)} places`);
    }
    if (count(s.tags) > 0) {
      parts.push(`${count(s.tags)} tags`);
    }
    if (count(s.albums) > 0) {
      parts.push(`${count(s.albums)} albums`);
    }
    if (count(s.spaces) > 0) {
      parts.push(`${count(s.spaces)} spaces`);
    }
    if (count(s.navigation) > 0) {
      parts.push(`${count(s.navigation)} pages`);
    }
    const counts = parts.join(', ');
    if (scopeCue && counts) {
      return `${scopeCue} ${counts}`;
    }
    return scopeCue || counts;
  });

  setQuery(text: string) {
    // In production setQuery only fires through global-search.svelte's $effect, which
    // is only mounted while the palette is open. Calling this method on a closed
    // manager is safe — sections mutate but no side effects escape — but should be
    // considered an implementation detail of the component, not a public entry point.
    if (this.query === text) {
      return;
    }
    if (this.pendingConfirmId !== null) {
      this.cancelConfirm();
    }
    this.query = text;
    this.clearDebounce();
    this.batchController?.abort();
    this.batchController = null;
    this.photosController?.abort();
    this.photosController = null;
    if (this.scope === 'all') {
      this.parseTypedSearchDraft(text);
    } else {
      this.clearTypedSearchDraft();
    }

    if (text.trim() === '') {
      this.clearTypedSearchDraft();
      this.sections = {
        photos: idle,
        people: idle,
        places: idle,
        tags: idle,
        albums: idle,
        spaces: idle,
        navigation: idle,
        commands: idle,
      };
      this.batchInFlight = false;
      this.inFlightCounter = 0;
      this._batchInFlightStartedAt = 0;
      return;
    }

    // SWR (stale-while-revalidate): only flip sections that are NOT already 'ok' to
    // loading. Preserving ok content across keystrokes fixes the jitter bug where the
    // palette flashed skeletons between every character. Scope-aware: non-scope
    // sections reset to idle synchronously so the 150ms debounce window doesn't flash
    // stale photo results under an @ scope. (`Array.includes` over a tiny tuple — not
    // a Set — to satisfy svelte/prefer-svelte-reactivity.)
    const inScope = ENTITY_KEYS_BY_SCOPE[this.scope];
    for (const key of ['photos', 'people', 'places', 'tags', 'albums', 'spaces'] as const) {
      if (!inScope.includes(key)) {
        this.sections[key] = idle;
        continue;
      }
      if (this.sections[key].status !== 'ok') {
        this.sections[key] = { status: 'loading' };
      }
    }
    // Navigation runs synchronously on every keystroke, bypassing the 150ms debounce.
    // It's a pure in-memory scan — no rate-limit or network concern. runBatch does NOT
    // iterate over navigation; its async dispatch tuple is
    // `photos/people/places/tags/albums/spaces`. Pass `(payload, scope)` so the
    // provider can branch: non-nav entity scopes hide the section entirely, bare
    // `>` returns the full filtered catalog sorted alphabetically, and fuzzy search
    // runs when there's a payload under scope 'all' or 'nav'.
    const searchProviderPayload = this.getSearchProviderPayload();
    this.sections.navigation = this.runNavigationProvider(searchProviderPayload, this.scope);
    // Commands mirror navigation: synchronous on every keystroke, bypasses the debounce.
    // Pass the current `topCommandMatch.id` so a command that is promoted to the top-
    // result slot doesn't also render inside its own section (same dedup shape the
    // component applies for nav).
    this.sections.commands = this.runCommandsProvider(
      searchProviderPayload,
      this.scope,
      this.topCommandMatch?.id ?? null,
    );
    // The prior cursor may point at a nav/entity item that no longer exists in the new
    // results. Reconcile synchronously so the highlight doesn't lag the displayed list.
    this.reconcileCursor();

    this.batchInFlight = true;
    // During the 150ms debounce window, `batchInFlight` is true but no request has
    // actually fired. We want the component-side 200ms grace check
    // `now - batchInFlightStartedAt > 200` to be FALSE so the stripe stays hidden.
    // Setting startedAt to +Infinity makes `now - Infinity = -Infinity`, which is not
    // greater than 200. runBatch overwrites this with `performance.now()` at fire-time.
    this._batchInFlightStartedAt = Number.POSITIVE_INFINITY;
    this.debounceTimer = setTimeout(() => this.runBatch(text, this.mode), 150);
  }

  protected runBatch(_text: string, mode: SearchMode) {
    this.debounceTimer = null;
    this._batchInFlightStartedAt = performance.now();
    const batch = new AbortController();
    const photosLocal = new AbortController();
    this.batchController = batch;
    this.photosController = photosLocal;

    // Reset the counter — this batch owns the bookkeeping from here on. Stale onSettle
    // calls from prior batches no-op via the check-before-decrement guard below,
    // preventing them from corrupting this batch's counter (which would deadlock
    // batchInFlight at true).
    this.inFlightCounter = 0;

    // Force non-scope entity sections to idle synchronously before dispatching. Under
    // a prefix scope (e.g. `@alice`), only the matching keys dispatch; everything
    // else gets reset so stale `ok` content from the pre-prefix query doesn't leak.
    // Navigation is intentionally omitted here — it's owned by `runNavigationProvider`
    // in setQuery and is NOT an entity section.
    const scope = this.scope;
    const payload = this.payload;
    const providerPayload = this.getSearchProviderPayload();
    const inScope = ENTITY_KEYS_BY_SCOPE[scope];
    for (const key of ['photos', 'people', 'places', 'tags', 'albums', 'spaces'] as const) {
      if (!inScope.includes(key)) {
        this.sections[key] = idle;
      }
    }

    // Navigation intentionally omitted: it flows through the synchronous
    // runNavigationProvider() call in setQuery and must NOT join the async
    // batch dispatch. Albums / spaces dispatch through their provider.run()
    // which delegates to runAlbums() / runSpaces() — see buildProviders().
    for (const key of ENTITY_KEYS_BY_SCOPE[scope]) {
      const provider = this.providers[key];
      // minQueryLength gate:
      //   - scope 'all': payload.length >= provider.minQueryLength (existing rule).
      //   - scope !== 'all' with payload: relax minRequired to 1.
      //   - scope !== 'all' with bare prefix (payload === ''): BYPASS entirely so
      //     the provider's bare-prefix branch renders suggestions.
      const isBare = scope !== 'all' && payload === '';
      const minRequired = scope === 'all' ? provider.minQueryLength : 1;
      if (!isBare && providerPayload.length < minRequired) {
        this.sections[key] = idle;
        continue;
      }
      this.inFlightCounter++;
      const controllers = key === 'photos' ? [batch.signal, photosLocal.signal] : [batch.signal];
      const signal = AbortSignal.any([...controllers, AbortSignal.timeout(PROVIDER_TIMEOUT_MS)]);

      const onSettle = () => {
        // Stale-batch guard: if a new batch has taken over the batchController, this
        // settle belongs to a superseded batch and must NOT decrement the new batch's
        // counter.
        if (batch !== this.batchController) {
          return;
        }
        this.inFlightCounter--;
        if (this.inFlightCounter === 0) {
          this.batchInFlight = false;
        }
      };

      // Promise.resolve().then(...) guarantees that a provider which synchronously
      // throws (not just returns a rejected promise) still lands in the .catch handler.
      Promise.resolve()
        .then(() => provider.run(providerPayload, mode, signal))
        .then((result) => {
          if (batch !== this.batchController) {
            return;
          }
          // Cast from `ProviderStatus<unknown>` to the entity section's concrete
          // generic. See the comment on EntityItem — every entity DTO structurally
          // satisfies it, and runBatch only iterates entity keys (not navigation).
          this.sections[key] = result as ProviderStatus<EntityItem>;
          if (key === 'photos') {
            this.onPhotosSettled();
          }
          this.reconcileCursor();
          onSettle();
        })
        .catch((error: unknown) => {
          if (batch !== this.batchController) {
            return;
          }
          if (error instanceof Error && error.name === 'AbortError') {
            if (signal.aborted && signal.reason instanceof DOMException && signal.reason.name === 'TimeoutError') {
              this.sections[key] = { status: 'timeout' };
              if (key === 'photos') {
                this.onPhotosSettled();
              }
            }
            onSettle();
            return;
          }
          const message = error instanceof Error ? error.message : 'unknown error';
          this.sections[key] = { status: 'error', message };
          if (key === 'photos') {
            this.onPhotosSettled();
          }
          onSettle();
        });
    }

    if (this.inFlightCounter === 0) {
      // All providers were below minQueryLength — nothing scheduled, flip off.
      this.batchInFlight = false;
    }
  }

  private clearDebounce() {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Filter / rank / slice the in-memory albums catalog for `rawQuery` and write the
   * result into `sections.albums`. Called by the albums provider entry in
   * `buildProviders()` — runBatch dispatches the albums key to that provider, which
   * delegates here, so this is the sole writer for the albums section.
   *
   * Scoring rules (all case-insensitive, query is trimmed):
   *   - name.startsWith(query) → score 2
   *   - name.includes(query)    → score 1
   *   - else                    → filtered out
   * Ties break alphabetically by `albumName`. Slice to top 5; `total` reports the
   * full pre-slice match count so the palette can render a "+N more" affordance.
   *
   * Bare-prefix branch: `rawQuery === ''` dispatches from runBatch when the user
   * types a bare `/`. Returns the top `ALBUMS_TOP_N` sorted by `endDate ?? ''`
   * desc. AlbumNameDto has no `updatedAt`; `endDate` — the most recent photo in
   * the album — is the closest activity proxy. The minQueryLength gate now lives
   * upstream in runBatch, so no `query.length < 2` early-return here.
   */
  async runAlbums(rawQuery: string): Promise<void> {
    const query = rawQuery.trim().toLowerCase();
    await this.ensureAlbumsCache();
    if (this.albumsCache === undefined) {
      // Catalog fetch failed mid-flight (AbortError) or was rejected and already
      // transitioned the section to 'error' via fetchAlbumsCatalog. Nothing to do.
      return;
    }

    if (query === '') {
      // Bare `/`: top N by `endDate ?? ''` desc. Albums without an endDate sink to
      // the bottom — the DTO has no updatedAt so endDate is the best proxy we have.
      const sorted = [...this.albumsCache].sort((a, b) => (b.endDate ?? '').localeCompare(a.endDate ?? ''));
      const top = sorted.slice(0, ALBUMS_TOP_N);
      this.sections.albums =
        top.length === 0
          ? { status: 'empty' }
          : { status: 'ok', items: top as unknown as EntityItem[], total: sorted.length };
      return;
    }

    type Scored = { album: AlbumNameDto; score: number };
    const matches: Scored[] = [];
    for (const album of this.albumsCache) {
      const name = album.albumName.toLowerCase();
      if (name.includes(query)) {
        matches.push({ album, score: name.startsWith(query) ? 2 : 1 });
      }
    }
    matches.sort((a, b) => b.score - a.score || a.album.albumName.localeCompare(b.album.albumName));

    if (matches.length === 0) {
      this.sections.albums = { status: 'empty' };
      return;
    }

    this.sections.albums = {
      status: 'ok',
      items: matches.slice(0, ALBUMS_TOP_N).map((m) => m.album) as unknown as EntityItem[],
      total: matches.length,
    };
  }

  /**
   * Filter / rank / slice the in-memory shared-spaces catalog for `rawQuery` and
   * write the result into `sections.spaces`. Mirrors `runAlbums` — matches on
   * `space.name` (not `albumName`), single source so no owned/shared dedupe. The
   * spaces provider entry in `buildProviders()` dispatches here; runBatch routes
   * the spaces key through that provider, so this is the sole writer for the
   * spaces section.
   *
   * Scoring rules (all case-insensitive, query is trimmed):
   *   - name.startsWith(query) → score 2
   *   - name.includes(query)    → score 1
   *   - else                    → filtered out
   * Ties break alphabetically by `name`. Slice to top 5; `total` reports the full
   * pre-slice match count so the palette can render a "+N more" affordance.
   *
   * Bare-prefix branch: `rawQuery === ''` dispatches from runBatch when the user
   * types a bare `/`. Returns the top `SPACES_TOP_N` sorted by
   * `(lastActivityAt ?? createdAt)` desc — falls back to creation date when the
   * space has never been touched. The minQueryLength gate now lives upstream in
   * runBatch, so no `query.length < 2` early-return here.
   */
  async runSpaces(rawQuery: string): Promise<void> {
    const query = rawQuery.trim().toLowerCase();
    await this.ensureSpacesCache();
    if (this.spacesCache === undefined) {
      // Catalog fetch failed mid-flight (AbortError) or was rejected and already
      // transitioned the section to 'error' via fetchSpacesCatalog. Nothing to do.
      return;
    }

    if (query === '') {
      // Bare `/`: top N by `(lastActivityAt ?? createdAt)` desc. Spaces with no
      // activity fall back to their creation date so first-time visitors still
      // see something meaningful.
      const recency = (s: SharedSpaceResponseDto): string => s.lastActivityAt ?? s.createdAt;
      const sorted = [...this.spacesCache].sort((a, b) => recency(b).localeCompare(recency(a)));
      const top = sorted.slice(0, SPACES_TOP_N);
      this.sections.spaces =
        top.length === 0
          ? { status: 'empty' }
          : { status: 'ok', items: top as unknown as EntityItem[], total: sorted.length };
      return;
    }

    type Scored = { space: SharedSpaceResponseDto; score: number };
    const matches: Scored[] = [];
    for (const space of this.spacesCache) {
      const name = space.name.toLowerCase();
      if (name.includes(query)) {
        matches.push({ space, score: name.startsWith(query) ? 2 : 1 });
      }
    }
    matches.sort((a, b) => b.score - a.score || a.space.name.localeCompare(b.space.name));

    if (matches.length === 0) {
      this.sections.spaces = { status: 'empty' };
      return;
    }

    this.sections.spaces = {
      status: 'ok',
      items: matches.slice(0, SPACES_TOP_N).map((m) => m.space) as unknown as EntityItem[],
      total: matches.length,
    };
  }

  private async runTagsProvider(query: string, signal: AbortSignal): Promise<ProviderStatus<TagResponseDto>> {
    if (this.tagsDisabled) {
      return { status: 'error', message: 'tag_cache_too_large' };
    }
    if (this.tagsCache === null) {
      try {
        const all = await getAllTags({ signal });
        if (all.length > 20_000) {
          this.tagsDisabled = true;

          console.warn('[cmdk] tag cache > 20k, disabling tag provider for session');
          return { status: 'error', message: 'tag_cache_too_large' };
        }
        if (all.length > 5000) {
          console.warn(`[cmdk] tag cache is large (${all.length} entries)`);
        }
        this.tagsCache = all;
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }
        return { status: 'error', message: error instanceof Error ? error.message : 'getAllTags failed' };
      }
    }
    if (query === '') {
      // Bare `#`: top 5 by `updatedAt` desc. TagResponseDto.updatedAt is required,
      // but the nullish fallback `?? ''` keeps the sort resilient against future
      // DTO loosening or partial payloads injected via tests.
      const sorted = [...this.tagsCache].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
      const matches = sorted.slice(0, 5);
      return matches.length === 0 ? { status: 'empty' } : { status: 'ok', items: matches, total: matches.length };
    }
    const q = query.toLowerCase();
    const matches = this.tagsCache.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 5);
    return matches.length === 0 ? { status: 'empty' } : { status: 'ok', items: matches, total: matches.length };
  }

  protected buildProviders(): Record<keyof Sections, Provider> {
    const photos: Provider = {
      key: 'photos',
      topN: 5,
      minQueryLength: 1,
      run: async (query, mode, signal) => {
        try {
          if (mode === 'smart') {
            // withSharedSpaces:true mirrors Gallery's main search page so palette
            // results include shared-space content the user can access.
            const response = await searchSmart(
              { smartSearchDto: { query, size: 5, withSharedSpaces: true } },
              { signal },
            );
            const items = response.assets.items;
            return items.length === 0 ? { status: 'empty' } : { status: 'ok', items, total: items.length };
          }
          // MetadataSearchDto does not have a withSharedSpaces field — shared-space
          // scoping for metadata search would require passing spaceId, which we do not
          // have in the palette. Only smart search includes shared-space content in v1.
          const metadataSearchDto: MetadataSearchDto = {
            size: 5,
            ...(mode === 'metadata' ? { originalFileName: query } : {}),
            ...(mode === 'description' ? { description: query } : {}),
            ...(mode === 'ocr' ? { ocr: query } : {}),
          };
          const response = await searchAssets({ metadataSearchDto }, { signal });
          const items = response.assets.items;
          return items.length === 0 ? { status: 'empty' } : { status: 'ok', items, total: items.length };
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw error;
          }
          return { status: 'error', message: error instanceof Error ? error.message : 'unknown error' };
        }
      },
    };

    const people: Provider = {
      key: 'people',
      topN: 5,
      minQueryLength: 2,
      run: async (query, _mode, signal) => {
        if (query === '') {
          // Bare-@: suggestions from getAllPeople, sorted via personSuggestionsComparator.
          try {
            await this.ensurePeopleSuggestionsCache();
          } catch {
            // ensurePeopleSuggestionsCache already transitioned the section (guarded
            // by scope/payload still being bare-@) or silently dropped an AbortError.
            // Return the current section state so runBatch's assignment is idempotent.
            return this.sections.people;
          }
          if (this.peopleSuggestionsCache === undefined) {
            // Mid-flight close (closeSignal abort) drops the cache without transitioning
            // the section — surface whatever the section currently holds.
            return this.sections.people;
          }
          const items = this.peopleSuggestionsCache.slice(0, 10);
          return items.length === 0 ? { status: 'empty' } : { status: 'ok', items, total: items.length };
        }
        try {
          const results = await searchPerson({ name: query, withHidden: false, withSharedSpaces: true }, { signal });
          return results.length === 0
            ? { status: 'empty' }
            : { status: 'ok', items: results.slice(0, 5), total: results.length };
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw error;
          }
          return { status: 'error', message: error instanceof Error ? error.message : 'unknown error' };
        }
      },
    };

    const places: Provider = {
      key: 'places',
      topN: 3,
      minQueryLength: 2,
      run: async (query, _mode, signal) => {
        try {
          const results = await searchPlaces({ name: query }, { signal });
          return results.length === 0
            ? { status: 'empty' }
            : { status: 'ok', items: results.slice(0, 3), total: results.length };
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw error;
          }
          return { status: 'error', message: error instanceof Error ? error.message : 'unknown error' };
        }
      },
    };

    const tags: Provider = {
      key: 'tags',
      topN: 5,
      minQueryLength: 2,
      run: (query, _mode, signal) => this.runTagsProvider(query, signal),
    };

    // Navigation provider is a stub. Task 10 wires runNavigationProvider into setQuery
    // directly (synchronous, bypassing the 150ms debounce). runBatch iterates only the
    // entity + albums + spaces keys — navigation is explicitly excluded — so this stub
    // is never invoked at runtime. It exists to satisfy the `Record<keyof Sections,
    // Provider>` contract. Regression test in Task 12 pins this.
    const navigationStub: Provider<NavigationItem> = {
      key: 'navigation',
      topN: 5,
      minQueryLength: 2,
      run: () => Promise.resolve({ status: 'empty' as const }),
    };

    // Commands, like navigation, do NOT dispatch through the runBatch async pipeline.
    // `runCommandsProvider` is called synchronously from setQuery alongside
    // `runNavigationProvider`. This entry's `run` is never invoked at runtime — it
    // exists only to satisfy the `Record<keyof Sections, Provider>` contract and to
    // publish the shared `topN` constant that `runCommandsProvider` reads.
    const commandsStub: Provider<CommandItem> = {
      key: 'commands',
      topN: 5,
      minQueryLength: 0,
      run: () => Promise.resolve({ status: 'empty' as const }),
    };

    // Albums provider dispatches to `runAlbums`, which filters the in-memory catalog
    // and writes `sections.albums` directly. Task 12 wired the albums key into
    // runBatch's iteration tuple, so `run()` is now invoked on the batch path. It
    // delegates to `runAlbums()` and returns the section state that method wrote,
    // so runBatch's subsequent `this.sections[key] = result` assignment is a no-op
    // self-assignment.
    const albums: Provider = {
      key: 'albums',
      topN: ALBUMS_TOP_N,
      minQueryLength: 2,
      run: async (query) => {
        await this.runAlbums(query);
        return this.sections.albums as ProviderStatus<EntityItem>;
      },
    };
    // Spaces provider dispatches to `runSpaces`, which filters the in-memory catalog
    // and writes `sections.spaces` directly. Same dispatch path as `albums` above —
    // runBatch iterates the spaces key, calls `run()`, which delegates to
    // `runSpaces()` and returns the section state that method wrote.
    const spaces: Provider = {
      key: 'spaces',
      topN: SPACES_TOP_N,
      minQueryLength: 2,
      run: async (query) => {
        await this.runSpaces(query);
        return this.sections.spaces as ProviderStatus<EntityItem>;
      },
    };

    return { photos, people, places, tags, albums, spaces, navigation: navigationStub, commands: commandsStub };
  }
}

export const globalSearchManager = new GlobalSearchManager();
