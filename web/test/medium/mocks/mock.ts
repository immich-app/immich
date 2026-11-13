import { MockData } from '#test/common/data.ts';
import { createApi, type MockApi } from '#test/common/dispatcher.ts';
import { assertMockClean, settleExpectations } from '#test/common/expectations.ts';
import { MockNetwork } from '#test/medium/mocks/api.ts';
import { MockConsole } from '#test/medium/mocks/logger.ts';
import type { BrowserContext, Download, Page } from '@playwright/test';

export class Mock {
  readonly data = new MockData();
  readonly api: MockApi<MockNetwork>;
  readonly logger = new MockConsole();

  constructor(private readonly context: BrowserContext) {
    const { lightStyle, darkStyle } = this.data.adminConfig.map;
    this.data.publicConfig.map = { ...this.data.publicConfig.map, lightStyle, darkStyle };
    this.api = createApi(new MockNetwork(context, this.data));
  }

  async setup({ page, baseURL }: { page?: Page; baseURL?: string } = {}) {
    const onDownload = (download: Download) => this.api.recordDownload(new URL(download.url()));
    if (baseURL) {
      await this.context.addCookies([{ name: 'immich_is_authenticated', value: 'true', url: baseURL }]);
    }
    await this.api.setup(baseURL);
    if (page) {
      this.logger.setup(page);
      page.on('download', onDownload);
    }

    return async ({ passed }: { passed: boolean }) => {
      if (passed) {
        await settleExpectations(this.api, this.logger);
      }
      await page?.goto('about:blank');
      page?.off('download', onDownload);
      this.logger.teardown();
      await this.api.teardown();
      await this.context.clearCookies();
      if (passed) {
        assertMockClean(this.api, this.logger);
      }
    };
  }
}
