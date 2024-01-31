import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAdminDto, CreateUserDto, CreateUserOAuthDto } from './create-user.dto';

describe('create user DTO', () => {
  it('validates the email', async () => {
    const parameters: Partial<CreateUserDto> = {
      email: undefined,
      password: 'password',
      name: 'name',
    };
    let dto: CreateUserDto = plainToInstance(CreateUserDto, parameters);
    let errors = await validate(dto);
    expect(errors).toHaveLength(1);

    parameters.email = 'invalid email';
    dto = plainToInstance(CreateUserDto, parameters);
    errors = await validate(dto);
    expect(errors).toHaveLength(1);

    parameters.email = 'valid@email.com';
    dto = plainToInstance(CreateUserDto, parameters);
    errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should allow emails without a tld', async () => {
    const someEmail = 'test@test';

    const dto = plainToInstance(CreateUserDto, {
      email: someEmail,
      password: 'some password',
      name: 'some name',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.email).toEqual(someEmail);
  });
});

describe('create admin DTO', () => {
  it('should allow emails without a tld', async () => {
    const someEmail = 'test@test';

    const dto = plainToInstance(CreateAdminDto, {
      isAdmin: true,
      email: someEmail,
      password: 'some password',
      name: 'some name',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.email).toEqual(someEmail);
  });
});

describe('create user oauth DTO', () => {
  it('should allow emails without a tld', async () => {
    const someEmail = 'test@test';

    const dto = plainToInstance(CreateUserOAuthDto, {
      email: someEmail,
      oauthId: 'some oauth id',
      name: 'some name',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.email).toEqual(someEmail);
  });
});
