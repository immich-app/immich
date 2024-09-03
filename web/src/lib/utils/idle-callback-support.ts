interface RequestIdleCallback {
  didTimeout?: boolean;
  timeRemaining?(): DOMHighResTimeStamp;
}
interface RequestIdleCallbackOptions {
  timeout?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fake_requestIdleCallback(cb: (deadline: RequestIdleCallback) => any, _?: RequestIdleCallbackOptions) {
  const start = Date.now();
  return setTimeout(cb({ didTimeout: false, timeRemaining: () => Math.max(0, 50 - (Date.now() - start)) }), 100);
}

function fake_cancelIdleCallback(id: number) {
  return clearTimeout(id);
}

export const idleCB = window.requestIdleCallback || fake_requestIdleCallback;
export const cancelIdleCB = window.cancelIdleCallback || fake_cancelIdleCallback;
