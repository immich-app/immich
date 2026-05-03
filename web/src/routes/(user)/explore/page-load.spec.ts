const { authenticate, getFormatter } = vi.hoisted(() => ({
  authenticate: vi.fn(),
  getFormatter: vi.fn(),
}));

vi.mock('$lib/utils/auth', () => ({ authenticate }));
vi.mock('$lib/utils/i18n', () => ({ getFormatter }));

import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { load } from './+page';

describe('explore page load', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getFormatter.mockResolvedValue((key: string) => key);
    sdkMock.getExploreData.mockResolvedValue([]);
    sdkMock.getAllPeople.mockResolvedValue({ people: [], total: 0, hidden: 0, hasNextPage: false });
  });

  it('loads visible global people with shared-space identities', async () => {
    const url = new URL('https://gallery.test/explore');

    await load({ url } as never);

    expect(authenticate).toHaveBeenCalledWith(url);
    expect(sdkMock.getExploreData).toHaveBeenCalledWith();
    expect(sdkMock.getAllPeople).toHaveBeenCalledWith({ withHidden: false, withSharedSpaces: true });
  });
});
