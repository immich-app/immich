import type { Public } from 'src/types.js';
import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';
import {
  type Contributor,
  type GitClient,
  type GitHubClient,
  NotesService,
  type PullRequest,
} from './notes';

type Fixture = Partial<PullRequest> & {
  number: number;
  original?: number;
  published?: boolean;
  commit?: boolean;
  known?: boolean;
};

const alice = { login: 'alice', bot: false };
const bob = { login: 'bob', bot: false };
const bot = { login: 'immich-push-o-matic', bot: true };

const link = (number: number) =>
  `https://github.com/immich-app/immich/pull/${number}`;
const fix = (number: number, author = alice) =>
  `* fix: change ${number} by @${author.login}${author.bot ? '[bot]' : ''} in ${link(number)}`;

const changelog = (...lines: string[]) =>
  [
    "## What's Changed",
    ...lines,
    '',
    '**Full Changelog**: https://github.com/immich-app/immich/compare/v3.2.4...v3.3.0',
    '',
  ].join('\n');

const body = (notes: string) => notes.slice(notes.indexOf("## What's Changed"));

describe(NotesService.name, () => {
  let git: Mocked<Public<GitClient>>;
  let github: Mocked<Public<GitHubClient>>;
  let sut: NotesService;

  const setup = (fixtures: Fixture[], firstTimers: Contributor[] = []) => {
    const pulls = new Map<number, PullRequest>();
    const log = ['> chore: version v3.3.0'];

    for (const {
      original,
      published,
      commit = true,
      known = true,
      ...overrides
    } of fixtures) {
      const pull: PullRequest = {
        title: `fix: change ${original ?? overrides.number}`,
        body: original ? `Backport of #${original} to \`release/v3.2\`.` : null,
        mergedAt: `2026-01-${String(overrides.number).padStart(2, '0')}T00:00:00Z`,
        author: original ? bot : alice,
        labels: original
          ? ['changelog:bugfix', 'backport']
          : ['changelog:bugfix'],
        ...overrides,
      };

      if (known) {
        pulls.set(pull.number, pull);
      }

      if (commit) {
        log.push(`${published ? '<' : '>'} ${pull.title} (#${pull.number})`);
      }
    }

    log.push('< chore: version v3.2.4');

    git.log.mockReturnValue(log.join('\n') + '\n');
    github.getPullRequests.mockImplementation(async (numbers) => {
      const found = new Map<number, PullRequest>();
      for (const number of numbers) {
        const pull = pulls.get(number);
        if (pull) {
          found.set(number, pull);
        }
      }
      return found;
    });
    github.getFirstTimers.mockResolvedValue(firstTimers);
  };

  const run = () => sut.handleNotes({ tag: 'v3.3.0', previous: 'v3.2.4' });

  beforeEach(() => {
    git = { log: vi.fn() };
    github = { getPullRequests: vi.fn(), getFirstTimers: vi.fn() };
    sut = new NotesService(git, github);
  });

  it('should compare the previous tag with the new tag', async () => {
    setup([{ number: 1 }]);

    await run();

    expect(git.log).toHaveBeenCalledWith('v3.2.4', 'v3.3.0');
  });

  it('should start with the template and end with the full changelog', async () => {
    setup([{ number: 1 }]);

    const notes = await run();

    expect(notes.startsWith('## Highlights')).toBe(true);
    expect(body(notes)).toMatchInlineSnapshot(`
      "## What's Changed
      ### 🐛 Bug fixes
      * fix: change 1 by @alice in https://github.com/immich-app/immich/pull/1

      **Full Changelog**: https://github.com/immich-app/immich/compare/v3.2.4...v3.3.0
      "
    `);
  });

  it('should attribute a backport to the original pull request', async () => {
    setup([
      { number: 2, original: 1 },
      { number: 1, commit: false },
    ]);

    const notes = await run();

    expect(github.getPullRequests).toHaveBeenNthCalledWith(1, [2]);
    expect(github.getPullRequests).toHaveBeenNthCalledWith(2, [1]);
    expect(body(notes)).toBe(changelog('### 🐛 Bug fixes', fix(1)));
  });

  it('should fall back to the backport when the body lacks a reference', async () => {
    setup([
      { number: 2, original: 1, body: '* BACKPORT-CONFLICT' },
      { number: 1, commit: false },
    ]);

    const notes = await run();

    expect(body(notes)).toBe(
      changelog(
        '### 🐛 Bug fixes',
        `* fix: change 1 by @immich-push-o-matic[bot] in ${link(2)}`,
      ),
    );
  });

  it('should drop main changes already published through a backport on the previous line', async () => {
    setup([
      { number: 3 },
      { number: 1 },
      { number: 2, original: 1, published: true },
    ]);

    const notes = await run();

    expect(body(notes)).toBe(changelog('### 🐛 Bug fixes', fix(3)));
  });

  it('should drop changes backported to both lines when the previous line shipped first', async () => {
    setup([
      { number: 3, original: 1 },
      { number: 4 },
      { number: 2, original: 1, published: true },
      { number: 1, commit: false },
    ]);

    const notes = await run();

    expect(body(notes)).toBe(changelog('### 🐛 Bug fixes', fix(4)));
  });

  it('should list each original once in merge order', async () => {
    setup([{ number: 6, original: 1 }, { number: 5 }, { number: 1 }]);

    const notes = await run();

    expect(body(notes)).toBe(changelog('### 🐛 Bug fixes', fix(1), fix(5)));
  });

  it('should ignore commits without a known pull request', async () => {
    setup([{ number: 1 }, { number: 99, known: false }]);

    const notes = await run();

    expect(body(notes)).toBe(changelog('### 🐛 Bug fixes', fix(1)));
  });

  it('should group by changelog label and omit unlisted labels', async () => {
    setup([
      { number: 3, labels: ['🗄️server', 'changelog:bugfix'] },
      { number: 2, labels: ['changelog:skip'] },
      { number: 1, labels: ['changelog:feature'] },
    ]);

    const notes = await run();

    expect(body(notes)).toBe(
      changelog('### 🚀 Features', fix(1), '### 🐛 Bug fixes', fix(3)),
    );
  });

  it('should look up first contributions using the earliest change per human author', async () => {
    setup([
      { number: 4, author: bob },
      { number: 3 },
      { number: 2 },
      { number: 1, author: bot },
    ]);

    await run();

    expect(github.getFirstTimers).toHaveBeenCalledWith([
      { author: alice, number: 2, mergedAt: '2026-01-02T00:00:00Z' },
      { author: bob, number: 4, mergedAt: '2026-01-04T00:00:00Z' },
    ]);
  });

  it('should render new contributors', async () => {
    setup(
      [{ number: 1 }],
      [{ author: alice, number: 1, mergedAt: '2026-01-01T00:00:00Z' }],
    );

    const notes = await run();

    expect(body(notes)).toMatchInlineSnapshot(`
      "## What's Changed
      ### 🐛 Bug fixes
      * fix: change 1 by @alice in https://github.com/immich-app/immich/pull/1

      ## New Contributors
      * @alice made their first contribution in https://github.com/immich-app/immich/pull/1

      **Full Changelog**: https://github.com/immich-app/immich/compare/v3.2.4...v3.3.0
      "
    `);
  });
});
