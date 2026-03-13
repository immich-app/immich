import type { SharedSpaceResponseDto } from '@immich/sdk';
import * as sdk from '@immich/sdk';

/**
 * Reusable mock helpers for shared space SDK functions.
 *
 * Requires `$lib/__mocks__/sdk.mock` to be imported first (auto-mocks @immich/sdk).
 *
 * Usage:
 * ```ts
 * import '$lib/__mocks__/sdk.mock';
 * import { spacesApiMock } from '@test-data/mocks/spaces-api.mock';
 *
 * beforeEach(() => { vi.resetAllMocks(); });
 *
 * it('lists spaces', async () => {
 *   spacesApiMock.getAllSpaces([space1, space2]);
 *   // ... test code that calls getAllSpaces
 * });
 * ```
 */
export const spacesApiMock = {
  /** Mock `getAllSpaces` to resolve with the given spaces. */
  getAllSpaces(spaces: SharedSpaceResponseDto[]) {
    vi.mocked(sdk.getAllSpaces).mockResolvedValue(spaces);
  },

  /** Mock `getSpace` to resolve with the given space. */
  getSpace(space: SharedSpaceResponseDto) {
    vi.mocked(sdk.getSpace).mockResolvedValue(space);
  },

  /** Mock `createSpace` to resolve with the given space. */
  createSpace(space: SharedSpaceResponseDto) {
    vi.mocked(sdk.createSpace).mockResolvedValue(space);
  },

  /** Mock `updateSpace` to resolve with the given space. */
  updateSpace(space: SharedSpaceResponseDto) {
    vi.mocked(sdk.updateSpace).mockResolvedValue(space);
  },

  /** Mock `removeSpace` to resolve void. */
  removeSpace() {
    vi.mocked(sdk.removeSpace).mockResolvedValue(void 0 as never);
  },

  /** Mock `addAssets` (space assets) to resolve void. */
  addAssets() {
    vi.mocked(sdk.addAssets).mockResolvedValue(void 0 as never);
  },

  /** Mock `removeAssets` (space assets) to resolve void. */
  removeAssets() {
    vi.mocked(sdk.removeAssets).mockResolvedValue(void 0 as never);
  },

  /** Mock `addMember` to resolve void. */
  addMember() {
    vi.mocked(sdk.addMember).mockResolvedValue(void 0 as never);
  },

  /** Mock `updateMember` to resolve void. */
  updateMember() {
    vi.mocked(sdk.updateMember).mockResolvedValue(void 0 as never);
  },

  /** Mock `markSpaceViewed` to resolve void. */
  markSpaceViewed() {
    vi.mocked(sdk.markSpaceViewed).mockResolvedValue(void 0 as never);
  },

  /** Mock `getSpaceActivities` to resolve with given activities. */
  getSpaceActivities(activities: unknown[]) {
    vi.mocked(sdk.getSpaceActivities).mockResolvedValue(activities as never);
  },
};
