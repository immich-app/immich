import { Spy } from '#test/medium/mock/helpers.ts';
import type { ConsoleMessage, Page } from '@playwright/test';

class ErrorSpy extends Spy<string, string | RegExp> {
  override matches(value: string, expected: string | RegExp) {
    return expected instanceof RegExp ? expected.test(value) : super.matches(value, expected);
  }
}

export class BrowserLogger {
  readonly error = new ErrorSpy('logger.error');
  private page?: Page;

  private readonly onPageError = (error: Error) => {
    this.error.record(`[pageerror] ${error.stack ?? error.message}`, { expected: true });
  };

  private readonly onConsole = (message: ConsoleMessage) => {
    if (message.type() === 'error') {
      this.error.record(`[console.error] ${message.text()}`, { expected: true });
    }
  };

  attach(page: Page) {
    this.page = page;
    page.on('pageerror', this.onPageError);
    page.on('console', this.onConsole);
  }

  detach() {
    this.page?.off('pageerror', this.onPageError);
    this.page?.off('console', this.onConsole);
    this.page = undefined;
  }
}
