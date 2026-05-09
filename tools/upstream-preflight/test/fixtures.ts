import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type TempRepo = {
  path: string;
  git: (...args: string[]) => string;
  write: (file: string, content: string) => void;
  commit: (message: string) => string;
};

export function createTempRepo(): TempRepo {
  const repoPath = fs.mkdtempSync(
    path.join(os.tmpdir(), 'gallery-upstream-preflight-'),
  );
  const git = (...args: string[]) =>
    execFileSync('git', args, {
      cwd: repoPath,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();

  git('init', '-b', 'main');
  git('config', 'user.name', 'Test User');
  git('config', 'user.email', 'test@example.com');

  const write = (file: string, content: string) => {
    const fullPath = path.join(repoPath, file);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
  };

  const commit = (message: string) => {
    git('add', '.');
    git('commit', '-m', message);
    return git('rev-parse', 'HEAD');
  };

  return { path: repoPath, git, write, commit };
}
