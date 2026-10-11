import {
  deleteActivity,
  getActivities,
  getActivityStatistics,
  ReactionType,
  type ActivityResponseDto,
} from '@immich/sdk';
import { activityManager } from '$lib/managers/activity-manager.svelte';

vi.mock('@immich/sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@immich/sdk')>()),
  deleteActivity: vi.fn(),
  getActivities: vi.fn(),
  getActivityStatistics: vi.fn(),
}));

const comment = (id: string) => ({ id, type: ReactionType.Comment, comment: id }) as ActivityResponseDto;

describe('ActivityManager', () => {
  it('keeps the other comments when a comment is deleted', async () => {
    const comments = [comment('first'), comment('second'), comment('third')];
    vi.mocked(getActivities).mockResolvedValue(comments);
    vi.mocked(getActivityStatistics).mockResolvedValue({ comments: 3, likes: 0 });
    await activityManager.init('album-id', 'asset-id');
    expect(activityManager.activities.map(({ id }) => id)).toEqual(['first', 'second', 'third']);

    vi.mocked(deleteActivity).mockReturnValue(new Promise(() => {}));
    void activityManager.deleteActivity(comments[1]);

    expect(activityManager.activities.map(({ id }) => id)).toEqual(['first', 'third']);
  });
});
