import { Spy } from '#test/medium/mock/helpers.ts';
import { expect as base, type ExpectMatcherState } from '@playwright/test';

declare global {
  namespace PlaywrightTest {
    interface Matchers<R, T> {
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(expected: T extends Spy<unknown, infer E> ? E : never): R;
    }
  }
}

type AnySpy = Spy<unknown, unknown>;

const assertSpy = (received: unknown): AnySpy => {
  if (received instanceof Spy) {
    return received;
  }
  throw new TypeError('This matcher expects a spy such as api.updateAsset or logger.error as the received value');
};

const describeCalls = (state: ExpectMatcherState, spy: AnySpy) => {
  if (spy.calls.length === 0) {
    return `${spy.name} was not called`;
  }
  return `Recorded ${spy.name} calls:\n${spy.calls.map((call) => `  ${state.utils.printReceived(call)}`).join('\n')}`;
};

const checkCalls = (
  state: ExpectMatcherState,
  received: unknown,
  name: string,
  expected: unknown,
  predicate: (value: unknown) => boolean,
) => {
  const spy = assertSpy(received);
  const found = spy.calls.filter((call) => predicate(call));
  for (const call of found) {
    spy.markSeen(call);
  }
  const pass = found.length > 0;
  const condition = `to have been called${expected === undefined ? '' : ` with ${state.utils.printExpected(expected)}`}`;
  return {
    pass,
    name,
    expected,
    message: () => `Expected ${spy.name} ${pass ? 'not ' : ''}${condition}\n${describeCalls(state, spy)}`,
  };
};

type MatcherResult = ReturnType<typeof checkCalls>;
type Matcher = (state: ExpectMatcherState, received: unknown, ...args: unknown[]) => MatcherResult;

const withState = (matcher: Matcher) =>
  function (this: ExpectMatcherState, received: unknown, ...args: unknown[]) {
    return matcher(this, received, ...args);
  };

export const expect = base.extend({
  toHaveBeenCalled: withState((state, received) =>
    checkCalls(state, received, 'toHaveBeenCalled', undefined, () => true),
  ),
  toHaveBeenCalledWith: withState((state, received, expected) =>
    checkCalls(state, received, 'toHaveBeenCalledWith', expected, (value) =>
      assertSpy(received).matches(value, expected),
    ),
  ),
});
