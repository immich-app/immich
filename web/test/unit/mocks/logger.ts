import { Spy } from '#test/common/expectations.ts';

const format = (args: unknown[]) =>
  args.map((arg) => (arg instanceof Error ? (arg.stack ?? arg.message) : String(arg))).join(' ');

const mediaUrl = (target: EventTarget | null) =>
  target instanceof HTMLImageElement || target instanceof HTMLVideoElement || target instanceof HTMLSourceElement
    ? target.src
    : undefined;

const benignBrowserErrors = ['ResizeObserver loop completed with undelivered notifications'];

const isBenignBrowserError = (message: string) => benignBrowserErrors.some((benign) => message.includes(benign));

export class MockConsole {
  readonly error = new Spy<string>('logger.error');
  readonly media: string[] = [];
  private restore?: () => void;

  private readonly onWindowError = (event: ErrorEvent) => {
    if (isBenignBrowserError(event.message)) {
      return;
    }

    this.error.record(`[pageerror] ${event.error?.stack ?? event.message}`, { expected: true });
  };

  private readonly onResourceError = (event: Event) => {
    const url = mediaUrl(event.target);
    if (url?.includes('/api/')) {
      this.media.push(url);
    }
  };

  setup() {
    const original = console.error;
    console.error = (...args: unknown[]) => {
      const message = format(args);
      if (isBenignBrowserError(message)) {
        return;
      }

      this.error.record(`[console.error] ${message}`, { expected: true });
    };
    addEventListener('error', this.onWindowError);
    document.addEventListener('error', this.onResourceError, { capture: true });
    this.restore = () => {
      console.error = original;
      removeEventListener('error', this.onWindowError);
      document.removeEventListener('error', this.onResourceError, true);
    };
  }

  teardown() {
    this.restore?.();
    this.restore = undefined;
  }
}
