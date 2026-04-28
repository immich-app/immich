const { authenticate, getFormatter } = vi.hoisted(() => ({
  authenticate: vi.fn(),
  getFormatter: vi.fn(),
}));

vi.mock('$lib/utils/auth', () => ({ authenticate }));
vi.mock('$lib/utils/i18n', () => ({ getFormatter }));

import { load } from './+page';

describe('memories page load', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getFormatter.mockResolvedValue((key: string) => key);
  });

  it('authenticates the request URL and returns translated metadata', async () => {
    const url = new URL('https://gallery.test/memories');

    await expect(load({ url } as never)).resolves.toEqual({
      meta: { title: 'memories' },
    });

    expect(authenticate).toHaveBeenCalledWith(url);
  });
});
