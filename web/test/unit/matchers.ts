import { Spy, matchesCall } from '#test/common/expectations.ts';
import { chai, expect } from 'vitest';

type AnySpy = Spy<unknown>;

const describeCalls = (spy: AnySpy) => {
  if (spy.calls.length === 0) {
    return `${spy.name} was not called`;
  }
  return `Recorded ${spy.name} calls:\n${spy.calls.map((call) => `  ${JSON.stringify(call)}`).join('\n')}`;
};

const assertCalls = (
  assertion: Chai.AssertionStatic,
  spy: AnySpy,
  expected: unknown,
  predicate: (value: unknown) => boolean,
) => {
  const condition = `to have been called${expected === undefined ? '' : ` with ${JSON.stringify(expected)}`}`;
  if (chai.util.flag(assertion, 'negate')) {
    assertion.assert(
      spy.calls.some((call) => predicate(call)),
      `Expected ${spy.name} ${condition}\n${describeCalls(spy)}`,
      `Expected ${spy.name} not ${condition}\n${describeCalls(spy)}`,
      expected,
      spy.calls,
    );
    return;
  }

  spy.expect(`${spy.name} ${condition}`, predicate);
};

const overwrite = (name: string, matcher: (assertion: Chai.AssertionStatic, spy: AnySpy, expected: unknown) => void) =>
  chai.util.overwriteMethod(chai.Assertion.prototype, name, (base: (...args: unknown[]) => void) => {
    return function (this: Chai.AssertionStatic, ...args: unknown[]) {
      const received = chai.util.flag(this, 'object') as unknown;
      if (received instanceof Spy) {
        matcher(this, received, args[0]);
        return;
      }
      base.apply(this, args);
    };
  });

overwrite('toHaveBeenCalled', (assertion, spy) => assertCalls(assertion, spy, undefined, () => true));
overwrite('toHaveBeenCalledWith', (assertion, spy, expected) =>
  assertCalls(assertion, spy, expected, (value) => matchesCall(value, expected, (a, b) => expect(a).toEqual(b))),
);
