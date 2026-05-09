import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { GitCommit } from './types';

export type GitRange = {
  commits: GitCommit[];
  files: string[];
  shortStat: string;
};

export type CommitSubject = { sha: string; subject: string };

export type CherryEquivalentResult = {
  equivalent: string[];
  missing: string[];
  raw: string[];
};

export function runGit(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

export function getMergeBase(cwd: string, left: string, right: string): string {
  return runGit(cwd, ['merge-base', left, right]);
}

export function getGitPath(cwd: string, relativePath: string): string {
  return runGit(cwd, ['rev-parse', '--git-path', relativePath]);
}

export function currentBranch(cwd: string): string {
  return runGit(cwd, ['branch', '--show-current']);
}

export function isCleanWorktree(cwd: string): boolean {
  return runGit(cwd, ['status', '--porcelain']) === '';
}

export function hasGitOperationInProgress(cwd: string): boolean {
  return [
    'rebase-merge',
    'rebase-apply',
    'MERGE_HEAD',
    'CHERRY_PICK_HEAD',
    'REVERT_HEAD',
  ].some((gitPath) => {
    const metadataPath = getGitPath(cwd, gitPath);
    return fs.existsSync(
      path.isAbsolute(metadataPath)
        ? metadataPath
        : path.resolve(cwd, metadataPath),
    );
  });
}

export function revParse(cwd: string, ref: string): string {
  try {
    return runGit(cwd, ['rev-parse', '--verify', `${ref}^{commit}`]);
  } catch (error) {
    throw new Error(`git rev-parse failed for ${ref}: ${gitError(error)}`);
  }
}

export function isAncestor(
  cwd: string,
  ancestor: string,
  descendant: string,
): boolean {
  const result = spawnSync(
    'git',
    ['merge-base', '--is-ancestor', ancestor, descendant],
    {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  if (result.status === 0) {
    return true;
  }
  if (result.status === 1) {
    return false;
  }

  throw new Error(
    `git merge-base --is-ancestor failed for ${ancestor}..${descendant}: ${result.stderr.trim()}`,
  );
}

export function listChangedFiles(cwd: string, range: string): string[] {
  try {
    return runGit(cwd, ['diff', '--name-only', range])
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .sort();
  } catch (error) {
    throw new Error(`git diff failed for ${range}: ${gitError(error)}`);
  }
}

export function listCommits(cwd: string, range: string): GitCommit[] {
  return collectGitRange(cwd, range).commits;
}

export function commitSubjects(cwd: string, range: string): CommitSubject[] {
  return listCommits(cwd, range).map(({ sha, subject }) => ({ sha, subject }));
}

export function cherryEquivalent(
  cwd: string,
  upstream: string,
  head: string,
): CherryEquivalentResult {
  const raw = runGit(cwd, ['cherry', upstream, head])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    raw,
    equivalent: raw
      .filter((line) => line.startsWith('- '))
      .map((line) => line.slice(2)),
    missing: raw
      .filter((line) => line.startsWith('+ '))
      .map((line) => line.slice(2)),
  };
}

export function collectGitRange(cwd: string, range: string): GitRange {
  const shas = runGit(cwd, ['rev-list', '--reverse', range])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const commits = shas.map((sha) => {
    const subject = runGit(cwd, ['log', '-1', '--format=%s', sha]);
    const files = runGit(cwd, [
      'diff-tree',
      '--no-commit-id',
      '--name-only',
      '-r',
      '-M',
      sha,
    ])
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .sort();

    return { sha, shortSha: sha.slice(0, 9), subject, files };
  });

  const files = runGit(cwd, ['diff', '--name-only', range])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();

  return {
    commits,
    files,
    shortStat: runGit(cwd, ['diff', '--shortstat', range]),
  };
}

type GitCommandError = Error & {
  stderr?: Buffer | string;
  status?: number;
  signal?: string;
};

function gitError(error: unknown): string {
  if (error instanceof Error) {
    const commandError = error as GitCommandError;
    const stderr = commandError.stderr?.toString().trim();
    if (stderr) {
      return stderr;
    }
    return error.message;
  }

  return String(error);
}
