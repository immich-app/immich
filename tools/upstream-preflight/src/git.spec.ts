import { describe, expect, it } from "vitest";
import { createTempRepo } from "../test/fixtures";
import {
  collectGitRange,
  getGitPath,
  getMergeBase,
  isAncestor,
  listChangedFiles,
  revParse,
} from "./git";

describe("git range collection", () => {
  it("collects commits, files, shortstat, merge base, and git metadata paths", () => {
    const repo = createTempRepo();
    repo.write("README.md", "base");
    const base = repo.commit("base commit");
    repo.git("checkout", "-b", "upstream");
    repo.write("server/src/services/search.service.ts", "upstream");
    const upstreamSha = repo.commit("refactor!: upstream search service");
    repo.git("checkout", "main");
    repo.write("server/src/services/shared-space.service.ts", "fork");
    repo.commit("feat: fork shared spaces");

    expect(getMergeBase(repo.path, "main", "upstream")).toBe(base);
    expect(
      getGitPath(repo.path, "upstream-preflight/preflight.json"),
    ).toContain("upstream-preflight/preflight.json");

    const range = collectGitRange(repo.path, `${base}..upstream`);

    expect(range.commits).toEqual([
      {
        sha: upstreamSha,
        shortSha: upstreamSha.slice(0, 9),
        subject: "refactor!: upstream search service",
        files: ["server/src/services/search.service.ts"],
      },
    ]);
    expect(range.files).toEqual(["server/src/services/search.service.ts"]);
    expect(range.shortStat).toContain("1 file changed");
  });

  it("checks ancestry between commits", () => {
    const repo = createTempRepo();
    repo.write("README.md", "base");
    const base = repo.commit("base commit");
    repo.write("server/src/services/search.service.ts", "head");
    const head = repo.commit("head commit");
    repo.git("checkout", "-b", "sibling", base);
    repo.write("mobile/lib/gallery.dart", "sibling");
    const sibling = repo.commit("sibling commit");

    expect(isAncestor(repo.path, base, head)).toBe(true);
    expect(isAncestor(repo.path, sibling, head)).toBe(false);
  });

  it("resolves refs to full commit shas", () => {
    const repo = createTempRepo();
    repo.write("README.md", "base");
    const head = repo.commit("base commit");

    expect(revParse(repo.path, "HEAD")).toBe(head);
    expect(revParse(repo.path, "HEAD")).toMatch(/^[0-9a-f]{40}$/);
  });

  it("lists changed files for a range in sorted order", () => {
    const repo = createTempRepo();
    repo.write("README.md", "base");
    const base = repo.commit("base commit");
    repo.write("web/src/routes/gallery.ts", "web");
    repo.write("server/src/gallery.ts", "server");
    const head = repo.commit("feature commit");

    expect(listChangedFiles(repo.path, `${base}..${head}`)).toEqual([
      "server/src/gallery.ts",
      "web/src/routes/gallery.ts",
    ]);
  });

  it("throws clear errors for invalid refs", () => {
    const repo = createTempRepo();
    repo.write("README.md", "base");
    repo.commit("base commit");

    expect(() => revParse(repo.path, "missing-ref")).toThrow(
      "git rev-parse failed for missing-ref:",
    );
    expect(() => isAncestor(repo.path, "missing-ref", "HEAD")).toThrow(
      "git merge-base --is-ancestor failed for missing-ref..HEAD:",
    );
    expect(() => listChangedFiles(repo.path, "missing-ref..HEAD")).toThrow(
      "git diff failed for missing-ref..HEAD:",
    );
  });
});
