import { assetViewerManager } from '#lib/managers/asset-viewer-manager.svelte.ts';
import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { featureFlagsManager } from '#lib/managers/feature-flags-manager.svelte.ts';
import { queryClient } from '#lib/queries/client.ts';
import { getPublicConfigQuery } from '#lib/queries/config-public.query.ts';
import { getServerConfigQuery } from '#lib/queries/server-info.query.ts';
import { locale } from '#lib/stores/preferences.store.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { getUiTranslations } from '#lib/utils/ui-translations.ts';
import { MockData } from '#test/common/data.ts';
import { createApi } from '#test/common/dispatcher.ts';
import { assertMockClean, settleExpectations } from '#test/common/expectations.ts';
import PageHost from '#test/unit/mocks/PageHost.svelte';
import { MockFetch } from '#test/unit/mocks/api.ts';
import { resetPage, setPage } from '#test/unit/mocks/app-state.svelte.ts';
import { MockConsole } from '#test/unit/mocks/logger.ts';
import { MockRouter } from '#test/unit/mocks/router.ts';
import { setTranslations } from '@immich/ui';
import { isRedirect } from '@sveltejs/kit';
import { tick, type Component } from 'svelte';
import { cleanup, render } from 'vitest-browser-svelte';

type Params = Record<string, string>;
export type PageComponent = Component<{ data: never; params: never }>;
export type PageLoad<TData> = (event: never) => Promise<TData | void>;

const createLoadEvent = (url: URL, params: Params) => ({
  url,
  params,
  route: { id: null },
  fetch,
  data: null,
  parent: () => Promise.resolve({}),
  depends: () => {},
  untrack: <T>(fn: () => T) => fn(),
});

export class Mock {
  readonly data = new MockData();
  readonly router = new MockRouter();
  readonly api = createApi(new MockFetch(this.data));
  readonly logger = new MockConsole();

  async setup() {
    document.cookie = 'immich_is_authenticated=true';
    locale.set('en');
    this.router.setup();
    this.api.setup();
    this.logger.setup();

    setTranslations(getUiTranslations(await getFormatter()));
    await queryClient.query(getServerConfigQuery());
    await queryClient.query(getPublicConfigQuery());
    await featureFlagsManager.init();

    return async ({ passed }: { passed: boolean }) => {
      if (passed) {
        await settleExpectations(this.api, this.logger);
      }
      cleanup();
      locale.set('default');
      authManager.reset();
      assetViewerManager.closeActivityPanel();
      queryClient.clear();
      resetPage();
      this.logger.teardown();
      this.api.teardown();
      this.router.teardown();
      if (passed) {
        assertMockClean(this.api, this.logger);
        return;
      }
      if (this.logger.media.length > 0) {
        console.warn(
          [
            'Media does not load in unit tests; anything that depends on a loaded image or video should be a medium test.',
            ...new Set(this.logger.media),
          ].join('\n  '),
        );
      }
    };
  }

  async settle() {
    const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));
    do {
      await nextTask();
      await nextTask();
    } while (this.api.pending > 0 || queryClient.isMutating() > 0 || queryClient.isFetching() > 0);
    await tick();
  }

  async render<TData>(component: PageComponent, load: PageLoad<TData>) {
    const { url, params } = this.router;
    const data = await this.load(load, url, params);

    setPage({ url, params, data: data as Record<string, unknown>, status: 200 });
    await render(PageHost, { component, data, params, client: queryClient });
    await tick();
  }

  private async load<TData>(load: PageLoad<TData>, url: URL, params: Params) {
    try {
      return (await load(createLoadEvent(url, params) as never)) ?? ({} as TData);
    } catch (error) {
      if (isRedirect(error)) {
        throw new Error(`Rendering ${url.pathname} redirected to ${error.location}`, { cause: error });
      }
      throw error;
    }
  }
}
