import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

describe('create user DTO', () => {
  it('validates the email', async() => {
    const params: Partial<CreateUserDto> = {
      email: undefined,
      password: 'password',
      firstName: 'first name',
      lastName: 'last name',
    }
    let dto: CreateUserDto = plainToInstance(CreateUserDto, params);
    let errors = await validate(dto);
    expect(errors).toHaveLength(1);

    params.email = 'invalid email';
    dto = plainToInstance(CreateUserDto, params);
    errors = await validate(dto);
    expect(errors).toHaveLength(1);

    params.email = 'valid@email.com';
    dto = plainToInstance(CreateUserDto, params);
    errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
