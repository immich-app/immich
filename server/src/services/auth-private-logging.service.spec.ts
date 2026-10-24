import { ForbiddenException } from '@nestjs/common';
import { ImmichHeader } from 'src/enum.js';
import { AuthService } from 'src/services/auth.service.js';
import { AuthFactory } from 'test/factories/auth.factory.js';
import { newTestService } from 'test/utils.js';

describe('AuthService private request denial logging', () => {
  it.each([
    { privateRoute: true, expectedUri: '[private request]' },
    { privateRoute: false, expectedUri: '/locked-albums/private-album-id' },
    { privateRoute: undefined, expectedUri: '/locked-albums/private-album-id' },
  ])('redacts only marked private shared-link denials ($privateRoute)', async ({ privateRoute, expectedUri }) => {
    const { sut, mocks } = newTestService(AuthService);
    vi.spyOn(sut, 'validateSharedLinkKey').mockResolvedValue(AuthFactory.from().sharedLink().build());
    await expect(
      sut.authenticate({
        headers: { [ImmichHeader.SharedLinkKey]: 'synthetic-key' },
        queryParams: {},
        metadata: {
          sharedLinkRoute: false,
          adminRoute: false,
          uri: '/locked-albums/private-album-id',
          privateRoute,
        },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(mocks.logger.warn).toHaveBeenCalledExactlyOnceWith(`Denied access to non-shared route: ${expectedUri}`);
  });

  it('redacts marked private admin denials too', async () => {
    const { sut, mocks } = newTestService(AuthService);
    vi.spyOn(sut, 'validateSharedLinkKey').mockResolvedValue(AuthFactory.from({ isAdmin: false }).sharedLink().build());
    await expect(
      sut.authenticate({
        headers: { [ImmichHeader.SharedLinkKey]: 'synthetic-key' },
        queryParams: {},
        metadata: { sharedLinkRoute: false, adminRoute: true, uri: '/locked-albums/private-id', privateRoute: true },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(mocks.logger.warn).toHaveBeenCalledExactlyOnceWith('Denied access to admin only route: [private request]');
  });
});
