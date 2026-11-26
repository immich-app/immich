import type { Dispatcher } from '#test/common/dispatcher.ts';

type Entry<T> = { value: T; seen: boolean; expected: boolean };
type Expectation<T> = { description: string; matches: (value: T) => boolean; met: boolean };

export const matchesCall = (value: unknown, expected: unknown, equals: (value: unknown, expected: unknown) => void) => {
  if (expected instanceof RegExp) {
    return typeof value === 'string' && expected.test(value);
  }
  try {
    equals(value, expected);
    return true;
  } catch {
    return false;
  }
};

export class Spy<TCall> {
  private readonly entries: Entry<TCall>[] = [];
  private readonly expectations: Expectation<TCall>[] = [];

  constructor(readonly name: string) {}

  get calls(): ReadonlyArray<TCall> {
    return this.entries.map((entry) => entry.value);
  }

  record(value: TCall, { expected = false } = {}) {
    const pending = this.expectations.find((expectation) => !expectation.met && expectation.matches(value));
    if (pending) {
      pending.met = true;
    }
    this.entries.push({ value, seen: pending !== undefined, expected });
  }

  expect(description: string, matches: (value: TCall) => boolean) {
    const found = this.entries.filter((entry) => matches(entry.value));
    for (const entry of found) {
      entry.seen = true;
    }
    if (found.length === 0) {
      this.expectations.push({ description, matches, met: false });
    }
  }

  unexpected() {
    return this.entries.filter((entry) => entry.expected && !entry.seen).map((entry) => entry.value);
  }

  missing() {
    return this.expectations.filter((expectation) => !expectation.met).map(({ description }) => description);
  }
}

const maxLines = 3;
const settleTimeout = 2000;
const settleInterval = 50;

type Logger = { error: Spy<string> };

const fixes = {
  'Handler errors': ['the shared handler in test/common/handlers.ts threw; fix it there'],
  'Unhandled requests': [
    'add a handler in test/common/handlers.ts, or one for this test only',
    '  api.on({ getAlbumInfo: () => ({ json: factory.album() }) });',
    "  api.on({ getAlbumInfo: () => ({ status: 500, json: { message: 'Server error', statusCode: 500 } }) });",
  ],
  'Network requests': [
    'assert the mutation the test expects',
    "  expect(api.updateAlbumInfo).toHaveBeenCalledWith({ params: { id: album.id }, body: { description: 'New' } });",
  ],
  'Browser errors': [
    'assert the console.error or page error the test expects',
    '  expect(logger.error).toHaveBeenCalledWith(/Server error/);',
  ],
  'Missing events': ['the test expected an event that never happened; check the action that should trigger it'],
} as const;

type ProblemKind = keyof typeof fixes;
type Problem = { kind: ProblemKind; line: string };

const missingEvents = (api: Dispatcher, logger: Logger) => [...api.missingExpectations(), ...logger.error.missing()];

export const settleExpectations = async (api: Dispatcher, logger: Logger) => {
  const deadline = Date.now() + settleTimeout;
  while (missingEvents(api, logger).length > 0 && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, settleInterval));
  }
};

export const assertMockClean = (api: Dispatcher, logger: Logger) => {
  const problems: Problem[] = [
    ...api.failures.map((line) => ({ kind: 'Handler errors' as const, line })),
    ...api.unhandled.map((line) => ({ kind: 'Unhandled requests' as const, line })),
    ...api.unexpectedCalls().map((line) => ({ kind: 'Network requests' as const, line })),
    ...logger.error.unexpected().map((line) => ({ kind: 'Browser errors' as const, line })),
    ...missingEvents(api, logger).map((line) => ({ kind: 'Missing events' as const, line })),
  ];
  if (problems.length > 0) {
    throw new Error(`Not every expected event was handled.\n\n${formatProblems(problems).join('\n\n')}`);
  }
};

const formatProblems = (problems: Problem[]) => {
  const kinds = new Map<ProblemKind, string[]>();
  for (const { kind, line } of problems) {
    kinds.set(kind, [...new Set([...(kinds.get(kind) ?? []), line])]);
  }
  return [...kinds].map(([kind, lines]) => formatSection(kind, lines).join('\n'));
};

const formatSection = (kind: ProblemKind, lines: string[]) => {
  const [summary, ...code] = fixes[kind];
  const heading = `── ${kind} (${lines.length}) `;
  return [
    heading.padEnd(66, '─'),
    ...indent(
      lines.flatMap((line, index) => formatOffender(line, index)),
      2,
    ),
    '',
    `  Example fix: ${summary}`,
    ...indent(code, 2),
  ];
};

const formatOffender = (line: string, index: number) => {
  const [first, ...rest] = line.split('\n', maxLines);
  return [
    `${index + 1}. ${first}`,
    ...indent(
      rest.map((frame) => frame.trim()),
      5,
    ),
  ];
};

const indent = (lines: readonly string[], width: number) => lines.map((line) => `${' '.repeat(width)}${line}`);
