import { describe, expect, it } from "vitest";
import { checkPackagePatchText } from "./patches";

const patch = {
  id: "immich-ui-command-patch",
  package: "@immich/ui",
  version_source: "pnpm-workspace.yaml",
  expected_patch: "patches/@immich__ui@0.76.2.patch",
  required_check: "fork-patches-check",
};

describe("checkPackagePatchText", () => {
  it("passes when the version source points at the expected patch", () => {
    const result = checkPackagePatchText(
      patch,
      "patchedDependencies:\n  '@immich/ui@0.76.2': patches/@immich__ui@0.76.2.patch\n",
      ["patches/@immich__ui@0.76.2.patch"],
    );

    expect(result.ok).toBe(true);
  });

  it("fails when the expected patch file is missing", () => {
    const result = checkPackagePatchText(
      patch,
      "patchedDependencies:\n  '@immich/ui@0.76.2': patches/@immich__ui@0.76.2.patch\n",
      [],
    );

    expect(result.ok).toBe(false);
    expect(result.details).toEqual([
      "Missing patch file patches/@immich__ui@0.76.2.patch",
    ]);
  });

  it("fails when the version source does not reference the patch", () => {
    const result = checkPackagePatchText(patch, "patchedDependencies: {}\n", [
      "patches/@immich__ui@0.76.2.patch",
    ]);

    expect(result.ok).toBe(false);
    expect(result.details).toEqual([
      "pnpm-workspace.yaml does not reference patches/@immich__ui@0.76.2.patch",
    ]);
  });
});
