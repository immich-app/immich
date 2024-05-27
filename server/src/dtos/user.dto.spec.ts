import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UserAdminCreateDto, UserUpdateMeDto } from 'src/dtos/user.dto';

describe('update user DTO', () => {
  it('should allow emails without a tld', async () => {
    const someEmail = 'test@test';

    const dto = plainToInstance(UserUpdateMeDto, {
      email: someEmail,
      id: '3fe388e4-2078-44d7-b36c-39d9dee3a657',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.email).toEqual(someEmail);
  });
});

describe('create user DTO', () => {
  it('validates the email', async () => {
    const params: Partial<UserAdminCreateDto> = {
      email: undefined,
      password: 'password',
      name: 'name',
    };
    let dto: UserAdminCreateDto = plainToInstance(UserAdminCreateDto, params);
    let errors = await validate(dto);
    expect(errors).toHaveLength(1);

    params.email = 'invalid email';
    dto = plainToInstance(UserAdminCreateDto, params);
    errors = await validate(dto);
    expect(errors).toHaveLength(1);

    params.email = 'valid@email.com';
    dto = plainToInstance(UserAdminCreateDto, params);
    errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should allow emails without a tld', async () => {
    const someEmail = 'test@test';

    const dto = plainToInstance(UserAdminCreateDto, {
      email: someEmail,
      password: 'some password',
      name: 'some name',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.email).toEqual(someEmail);
  });
});
