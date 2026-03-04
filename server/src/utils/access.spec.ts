import { UnauthorizedException } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto';
import { Permission } from 'src/enum';
import { checkAccess, requireElevatedPermission } from 'src/utils/access';
import { newAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newUuid } from 'test/small.factory';

describe('requireElevatedPermission', () => {
  it('should throw UnauthorizedException when session has no elevated permission', () => {
    const auth: AuthDto = {
      user: { id: newUuid(), isAdmin: false, name: 'test', email: 'test@test.com', quotaUsageInBytes: 0, quotaSizeInBytes: null },
      session: { id: newUuid(), hasElevatedPermission: false },
    };

    expect(() => requireElevatedPermission(auth)).toThrow(UnauthorizedException);
    expect(() => requireElevatedPermission(auth)).toThrow('Elevated permission is required');
  });

  it('should throw UnauthorizedException when session is undefined', () => {
    const auth: AuthDto = {
      user: { id: newUuid(), isAdmin: false, name: 'test', email: 'test@test.com', quotaUsageInBytes: 0, quotaSizeInBytes: null },
    };

    expect(() => requireElevatedPermission(auth)).toThrow(UnauthorizedException);
  });

  it('should not throw when session has elevated permission', () => {
    const auth: AuthDto = {
      user: { id: newUuid(), isAdmin: false, name: 'test', email: 'test@test.com', quotaUsageInBytes: 0, quotaSizeInBytes: null },
      session: { id: newUuid(), hasElevatedPermission: true },
    };

    expect(() => requireElevatedPermission(auth)).not.toThrow();
  });
});

describe('checkOtherAccess default case', () => {
  it('should return an empty set for an unhandled permission', async () => {
    const accessMock = newAccessRepositoryMock();
    const auth: AuthDto = {
      user: { id: newUuid(), isAdmin: false, name: 'test', email: 'test@test.com', quotaUsageInBytes: 0, quotaSizeInBytes: null },
    };

    // Use a permission value that is not handled in the switch statement
    // Permission.All is not handled in checkOtherAccess and should fall through to default
    const result = await checkAccess(accessMock as any, {
      auth,
      permission: Permission.All,
      ids: new Set([newUuid()]),
    });

    expect(result).toEqual(new Set());
  });
});
