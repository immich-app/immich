import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Public } from 'src/types.js';
import { parse } from 'yaml';

const findRoot = (dir: string): string =>
  existsSync(join(dir, 'pnpm-workspace.yaml')) ? dir : findRoot(dirname(dir));

const root = findRoot(dirname(fileURLToPath(import.meta.url)));

const REPO = 'immich-app/immich';

const Files = {
  Config: join(root, '.github/release.yml'),
  Template: join(root, 'misc/release/notes.tmpl'),
  Output: join(root, 'misc/release/notes.md'),
};

export type NotesOptions = {
  tag: string;
  previous: string;
};

type Side = 'left' | 'right';
type Commit = { side: Side; number: number };

type Author = { login: string; bot: boolean };
export type PullRequest = {
  number: number;
  title: string;
  body: string | null;
  mergedAt: string;
  author: Author;
  labels: string[];
};

type Category = { title: string; labels: string[] };
export type Contributor = { author: Author; number: number; mergedAt: string };

type GraphQlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type PullRequestNode = {
  number: number;
  title: string;
  body: string | null;
  mergedAt: string;
  author: { __typename: string; login: string } | null;
  labels: { nodes: Array<{ name: string }> };
};

const PULL_REQUEST_BATCH = 50;
const SEARCH_BATCH = 20;

export class FileSystem {
  writeFileSync(path: string, data: string) {
    writeFileSync(path, data);
  }
}

export class GitClient {
  log(previous: string, tag: string) {
    return execFileSync(
      'git',
      [
        'log',
        '--left-right',
        '--no-merges',
        '--format=%m %s',
        `${previous}...${tag}`,
      ],
      { cwd: root, encoding: 'utf8' },
    );
  }
}

export class GitHubClient {
  constructor(private token: string) {}

  async getPullRequests(numbers: number[]) {
    const pulls = new Map<number, PullRequest>();
    const [owner, name] = REPO.split('/');

    for (const batch of this.chunk(numbers, PULL_REQUEST_BATCH)) {
      const fields = batch
        .map(
          (number) =>
            `pr_${number}: pullRequest(number: ${number}) { ...PullRequestFields }`,
        )
        .join('\n');

      const query = `
        query($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) { ${fields} }
        }
        fragment PullRequestFields on PullRequest {
          number
          title
          body
          mergedAt
          author { __typename login }
          labels(first: 100) { nodes { name } }
        }`;

      const data = await this.graphql<{
        repository: Record<string, PullRequestNode | null>;
      }>(query, { owner, name });

      for (const node of Object.values(data.repository)) {
        if (!node?.mergedAt) {
          continue;
        }

        pulls.set(node.number, {
          number: node.number,
          title: node.title,
          body: node.body,
          mergedAt: node.mergedAt,
          author: {
            login: node.author?.login ?? 'ghost',
            bot: node.author?.__typename === 'Bot',
          },
          labels: node.labels.nodes.map(({ name }) => name),
        });
      }
    }

    return pulls;
  }

  async getFirstTimers(candidates: Contributor[]) {
    const firstTimers: Contributor[] = [];

    for (const batch of this.chunk(candidates, SEARCH_BATCH)) {
      const fields = batch
        .map(({ author, mergedAt }, index) => {
          const search = JSON.stringify(
            `repo:${REPO} is:pr is:merged author:${author.login} merged:<${mergedAt}`,
          );
          return `c_${index}: search(query: ${search}, type: ISSUE, first: 1) { issueCount }`;
        })
        .join('\n');

      const data = await this.graphql<Record<string, { issueCount: number }>>(
        `query { ${fields} }`,
      );

      for (const [index, candidate] of batch.entries()) {
        if (data[`c_${index}`].issueCount === 0) {
          firstTimers.push(candidate);
        }
      }
    }

    return firstTimers;
  }

  async getCreditBodies(candidates: Contributor[]) {
    const bodies = new Map<string, string[]>();

    for (const batch of this.chunk(candidates, SEARCH_BATCH)) {
      const fields = batch
        .map(({ author, mergedAt }, index) => {
          const search = JSON.stringify(
            `repo:${REPO} is:pr is:merged in:body "credit" "${author.login}" merged:<${mergedAt}`,
          );
          return `c_${index}: search(query: ${search}, type: ISSUE, first: 100) { nodes { ... on PullRequest { body } } }`;
        })
        .join('\n');

      const data = await this.graphql<
        Record<string, { nodes: Array<{ body?: string }> }>
      >(`query { ${fields} }`);

      for (const [index, { author }] of batch.entries()) {
        bodies.set(
          author.login,
          data[`c_${index}`].nodes.flatMap(({ body }) => body ?? []),
        );
      }
    }

    return bodies;
  }

  private chunk<T>(items: T[], size: number) {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  }

  private async graphql<T>(query: string, variables?: Record<string, string>) {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(
        `GitHub GraphQL request failed: ${response.status} ${response.statusText}`,
      );
    }

    const { data, errors } = (await response.json()) as GraphQlResponse<T>;
    if (!data) {
      throw new Error(
        `GitHub GraphQL request failed: ${errors?.map(({ message }) => message).join(', ')}`,
      );
    }

    return data;
  }
}

export class NotesService {
  constructor(
    private fs: Public<FileSystem>,
    private git: Public<GitClient>,
    private github: Public<GitHubClient>,
  ) {}

  async handleNotes({ tag, previous }: NotesOptions) {
    const commits = this.parseCommits(this.git.log(previous, tag));
    const pulls = await this.getPullRequests(commits);
    const changes = this.selectChanges(commits, pulls);
    const firstTimers = await this.getFirstTimers(changes);
    const notes = this.render({ tag, previous, changes, firstTimers });

    this.fs.writeFileSync(Files.Output, notes);
  }

  private parseCommits(log: string): Commit[] {
    return log.split('\n').flatMap((line) => {
      const match = line.match(/^([<>]) .*\(#(\d+)\)$/);
      return match
        ? {
            side: match[1] === '<' ? 'left' : 'right',
            number: Number(match[2]),
          }
        : [];
    });
  }

  private async getPullRequests(commits: Commit[]) {
    const pulls = await this.github.getPullRequests(
      this.unique(commits.map(({ number }) => number)),
    );

    const originals = this.unique(
      [...pulls.values()].map((pull) => this.toOriginal(pull)),
    ).filter((number) => !pulls.has(number));

    for (const [number, pull] of await this.github.getPullRequests(originals)) {
      pulls.set(number, pull);
    }

    return pulls;
  }

  private toOriginal(pull: PullRequest) {
    const match = pull.body?.match(/^Backport of #(\d+) to `release\//);
    return match ? Number(match[1]) : pull.number;
  }

  private selectChanges(commits: Commit[], pulls: Map<number, PullRequest>) {
    const originals = (side: Side) =>
      commits
        .filter((commit) => commit.side === side)
        .flatMap((commit) => pulls.get(commit.number) ?? [])
        .map((pull) => this.toOriginal(pull));

    const published = new Set(originals('left'));

    return this.unique(originals('right'))
      .filter((number) => !published.has(number))
      .flatMap((number) => pulls.get(number) ?? [])
      .sort((a, b) => a.mergedAt.localeCompare(b.mergedAt));
  }

  private parseCredits(body: string | null): Author[] {
    const lines = body?.match(/^credit:.*$/gim) ?? [];
    return lines
      .flatMap((line) => line.match(/(?<=[\s:,]@)[\w-]+/g) ?? [])
      .map((login) => ({ login, bot: false }));
  }

  private toAuthors({ author, body }: PullRequest) {
    return [author, ...this.parseCredits(body)];
  }

  private async getFirstTimers(changes: PullRequest[]) {
    const candidates = new Map<string, Contributor>();

    for (const pull of changes) {
      const { number, mergedAt } = pull;
      for (const author of this.toAuthors(pull)) {
        const key = author.login.toLowerCase();
        if (!author.bot && !candidates.has(key)) {
          candidates.set(key, { author, number, mergedAt });
        }
      }
    }

    const firstTimers = await this.github.getFirstTimers([
      ...candidates.values(),
    ]);
    const bodies = await this.github.getCreditBodies(firstTimers);

    return firstTimers.filter(
      ({ author }) =>
        !bodies
          .get(author.login)
          ?.some((body) => this.isCredited(body, author)),
    );
  }

  private isCredited(body: string, { login }: Author) {
    return this.parseCredits(body).some(
      (credit) => credit.login.toLowerCase() === login.toLowerCase(),
    );
  }

  private render({
    tag,
    previous,
    changes,
    firstTimers,
  }: NotesOptions & { changes: PullRequest[]; firstTimers: Contributor[] }) {
    const { changelog } = parse(readFileSync(Files.Config, 'utf8')) as {
      changelog: { categories: Category[] };
    };

    const sections = [
      readFileSync(Files.Template, 'utf8').trim(),
      [
        "## What's Changed",
        ...changelog.categories.flatMap(({ title, labels }) => {
          const matches = changes.filter((pull) =>
            pull.labels.some((label) => labels.includes(label)),
          );
          return matches.length === 0
            ? []
            : [
                `### ${title}`,
                ...matches.map(
                  (pull) =>
                    `* ${pull.title} by ${this.byline(pull)} in ${this.link(pull.number)}`,
                ),
              ];
        }),
      ].join('\n'),
    ];

    if (firstTimers.length > 0) {
      sections.push(
        [
          '## New Contributors',
          ...firstTimers.map(
            ({ author, number }) =>
              `* ${this.mention(author)} made their first contribution in ${this.link(number)}`,
          ),
        ].join('\n'),
      );
    }

    sections.push(
      `**Full Changelog**: https://github.com/${REPO}/compare/${previous}...${tag}`,
    );

    return sections.join('\n\n') + '\n';
  }

  private link(number: number) {
    return `https://github.com/${REPO}/pull/${number}`;
  }

  private mention({ login, bot }: Author) {
    return `@${login}${bot ? '[bot]' : ''}`;
  }

  private byline(pull: PullRequest) {
    return new Intl.ListFormat('en', { type: 'conjunction' }).format(
      this.unique(this.toAuthors(pull).map((author) => this.mention(author))),
    );
  }

  private unique<T>(items: T[]) {
    return [...new Set(items)];
  }
}
