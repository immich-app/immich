import { UserAdminCreateSchema, UserUpdateMeSchema } from 'src/dtos/user.dto';

describe('update user DTO', () => {
  it('should allow emails without a tld', () => {
    const someEmail = 'test@test';
    const result = UserUpdateMeSchema.safeParse({
      email: someEmail,
      id: '3fe388e4-2078-44d7-b36c-39d9dee3a657',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toEqual(someEmail);
    }
  });
});

describe('create user DTO', () => {
  it('validates the email', () => {
    expect(UserAdminCreateSchema.safeParse({ password: 'password', name: 'name' }).success).toBe(false);

    expect(
      UserAdminCreateSchema.safeParse({ email: 'invalid email', password: 'password', name: 'name' }).success,
    ).toBe(false);

    const result = UserAdminCreateSchema.safeParse({
      email: 'valid@email.com',
      password: 'password',
      name: 'name',
    });
    expect(result.success).toBe(true);
  });

  it('validates invalid email type', () => {
    expect(
      UserAdminCreateSchema.safeParse({
        email: [],
        password: 'some password',
        name: 'some name',
      }).success,
    ).toBe(false);

    expect(
      UserAdminCreateSchema.safeParse({
        email: {},
        password: 'some password',
        name: 'some name',
      }).success,
    ).toBe(false);
  });

  it('should allow emails without a tld', () => {
    const someEmail = 'test@test';
    const result = UserAdminCreateSchema.safeParse({
      email: someEmail,
      password: 'some password',
      name: 'some name',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toEqual(someEmail);
    }
  });
});
