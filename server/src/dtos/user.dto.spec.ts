import { UserAdminCreateSchema, UserAdminUpdateDto, UserUpdateMeSchema, mapUser } from 'src/dtos/user.dto.js';

describe('update user DTO', () => {
  it('should allow emails without a tld', () => {
    const someEmail = 'test@test';
    const result = UserUpdateMeSchema.safeParse({
      email: someEmail,
      id: '3fe388e4-2078-44d7-b36c-39d9dee3a657',
    });
    expect(result.success).toBe(true);
    expect(result.data?.email).toEqual(someEmail);
  });

  it('should transform an empty name to null', () => {
    const result = UserUpdateMeSchema.safeParse({ name: '' });
    expect(result.success).toBe(true);
    expect(result.data?.name).toBeNull();
  });

  it('should leave a non-empty name untouched', () => {
    const result = UserUpdateMeSchema.safeParse({ name: 'Alan Turing' });
    expect(result.success).toBe(true);
    expect(result.data?.name).toEqual('Alan Turing');
  });

  it('should allow name to be omitted', () => {
    const result = UserUpdateMeSchema.safeParse({ email: 'test@test' });
    expect(result.success).toBe(true);
    expect(result.data?.name).toBeUndefined();
  });
});

describe('mapUser', () => {
  const baseUser = {
    id: '3fe388e4-2078-44d7-b36c-39d9dee3a657',
    email: 'test@immich.app',
    profileImagePath: '',
    avatarColor: null,
    profileChangedAt: new Date(),
  };

  it('should return an empty string when the entity name is null', () => {
    const result = mapUser({ ...baseUser, name: null });
    expect(result.name).toEqual('');
  });

  it('should return the entity name when it is set', () => {
    const result = mapUser({ ...baseUser, name: 'Alan Turing' });
    expect(result.name).toEqual('Alan Turing');
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

  it('should transform an empty name to null', () => {
    const result = UserAdminCreateSchema.safeParse({
      email: 'valid@email.com',
      password: 'password',
      name: '',
    });
    expect(result.success).toBe(true);
    expect(result.data?.name).toBeNull();
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
    expect(result.data?.email).toEqual(someEmail);
  });
});

describe('admin update user DTO', () => {
  it('should transform an empty name to null', () => {
    const result = UserAdminUpdateDto.schema.safeParse({ name: '' });
    expect(result.success).toBe(true);
    expect(result.data?.name).toBeNull();
  });

  it('should leave a non-empty name untouched', () => {
    const result = UserAdminUpdateDto.schema.safeParse({ name: 'Alan Turing' });
    expect(result.success).toBe(true);
    expect(result.data?.name).toEqual('Alan Turing');
  });

  it('should allow name to be omitted', () => {
    const result = UserAdminUpdateDto.schema.safeParse({ email: 'test@test.com' });
    expect(result.success).toBe(true);
    expect(result.data?.name).toBeUndefined();
  });
});
