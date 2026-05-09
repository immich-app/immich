import { describe, expect, it } from 'vitest';
import { createTempRepo } from '../test/fixtures';
import {
  cherryEquivalent,
  collectGitRange,
  commitSubjects,
  currentBranch,
  getGitPath,
  getMergeBase,
  hasGitOperationInProgress,
  isAncestor,
  isCleanWorktree,
  listChangedFiles,
  listCommits,
  revParse,
} from './git';

describe('git range collection', () => {
  it('collects commits, files, shortstat, merge base, and git metadata paths', () => {
    const repo = createTempRepo();
    repo.write('README.md', 'base');
    const base = repo.commit('base commit');
    repo.git('checkout', '-b', 'upstream');
    repo.write('server/src/services/search.service.ts', 'upstream');
    const upstreamSha = repo.commit('refactor!: upstream search service');
    repo.git('checkout', 'main');
    repo.write('server/src/services/shared-space.service.ts', 'fork');
    repo.commit('feat: fork shared spaces');

    expect(getMergeBase(repo.path, 'main', 'upstream')).toBe(base);
    expect(
      getGitPath(repo.path, 'upstream-preflight/preflight.json'),
    ).toContain('upstream-preflight/preflight.json');

    const range = collectGitRange(repo.path, `${base}..upstream`);

    expect(range.commits).toEqual([
      {
        sha: upstreamSha,
        shortSha: upstreamSha.slice(0, 9),
        subject: 'refactor!: upstream search service',
        files: ['server/src/services/search.service.ts'],
      },
    ]);
    expect(range.files).toEqual(['server/src/services/search.service.ts']);
    expect(range.shortStat).toContain('1 file changed');
  });

  it('checks ancestry between commits', () => {
    const repo = createTempRepo();
    repo.write('README.md', 'base');
    const base = repo.commit('base commit');
    repo.write('server/src/services/search.service.ts', 'head');
    const head = repo.commit('head commit');
    repo.git('checkout', '-b', 'sibling', base);
    repo.write('mobile/lib/gallery.dart', 'sibling');
    const sibling = repo.commit('sibling commit');

    expect(isAncestor(repo.path, base, head)).toBe(true);
    expect(isAncestor(repo.path, sibling, head)).toBe(false);
  });

  it('resolves refs to full commit shas', () => {
    const repo = createTempRepo();
    repo.write('README.md', 'base');
    const head = repo.commit('base commit');

    expect(revParse(repo.path, 'HEAD')).toBe(head);
    expect(revParse(repo.path, 'HEAD')).toMatch(/^[0-9a-f]{40}$/);
  });

  it('lists changed files for a range in sorted order', () => {
    const repo = createTempRepo();
    repo.write('README.md', 'base');
    const base = repo.commit('base commit');
    repo.write('web/src/routes/gallery.ts', 'web');
    repo.write('server/src/gallery.ts', 'server');
    const head = repo.commit('feature commit');

    expect(listChangedFiles(repo.path, `${base}..${head}`)).toEqual([
      'server/src/gallery.ts',
      'web/src/routes/gallery.ts',
    ]);
  });

  it('throws clear errors for invalid refs', () => {
    const repo = createTempRepo();
    repo.write('README.md', 'base');
    repo.commit('base commit');

    expect(() => revParse(repo.path, 'missing-ref')).toThrow(
      'git rev-parse failed for missing-ref:',
    );
    expect(() => isAncestor(repo.path, 'missing-ref', 'HEAD')).toThrow(
      'git merge-base --is-ancestor failed for missing-ref..HEAD:',
    );
    expect(() => listChangedFiles(repo.path, 'missing-ref..HEAD')).toThrow(
      'git diff failed for missing-ref..HEAD:',
    );
  });

  it('reports branch, clean state, and in-progress git operations', () => {
    const repo = createTempRepo();
    repo.write('README.md', 'base');
    repo.commit('base commit');

    expect(currentBranch(repo.path)).toBe('main');
    expect(isCleanWorktree(repo.path)).toBe(true);
    repo.write('dirty.txt', 'dirty');
    expect(isCleanWorktree(repo.path)).toBe(false);
    expect(hasGitOperationInProgress(repo.path)).toBe(false);
  });

  it('detects real in-progress git operations', () => {
    const repo = createTempRepo();
    repo.write('conflict.txt', 'base\n');
    repo.commit('base commit');
    repo.git('checkout', '-b', 'incoming');
    repo.write('conflict.txt', 'incoming\n');
    repo.commit('incoming commit');
    repo.git('checkout', 'main');
    repo.write('conflict.txt', 'main\n');
    repo.commit('main commit');

    expect(() => repo.git('merge', 'incoming')).toThrow();
    expect(hasGitOperationInProgress(repo.path)).toBe(true);
  });

  it('lists commits and subjects in chronological order', () => {
    const repo = createTempRepo();
    repo.write('README.md', 'base');
    const base = repo.commit('base commit');
    repo.write('one.txt', 'one');
    const one = repo.commit('feat: one (#1)');
    repo.write('two.txt', 'two');
    const two = repo.commit('fix: two (#2)');

    expect(
      listCommits(repo.path, `${base}..HEAD`).map((commit) => commit.sha),
    ).toEqual([one, two]);
    expect(commitSubjects(repo.path, `${base}..HEAD`)).toEqual([
      { sha: one, subject: 'feat: one (#1)' },
      { sha: two, subject: 'fix: two (#2)' },
    ]);
  });

  it('reports cherry-equivalent patches', () => {
    const repo = createTempRepo();
    repo.write('README.md', 'base');
    const base = repo.commit('base commit');
    repo.git('checkout', '-b', 'left');
    repo.write('feature.txt', 'same');
    repo.commit('feat: same patch');
    repo.git('checkout', '-b', 'right', base);
    repo.write('feature.txt', 'same');
    const equivalent = repo.commit('feat: rebased same patch');
    repo.write('right-only.txt', 'right only');
    const missing = repo.commit('feat: right-only patch');

    const result = cherryEquivalent(repo.path, 'left', 'right');
    expect(result.raw).toEqual([`- ${equivalent}`, `+ ${missing}`]);
    expect(result.equivalent).toEqual([equivalent]);
    expect(result.missing).toEqual([missing]);
  });
});
