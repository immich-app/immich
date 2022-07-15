import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SignUpDto } from './sign-up.dto';

describe('sign up DTO', () => {
  it('validates the email', async () => {
    const params: Partial<SignUpDto> = {
      email: undefined,
      password: 'password',
      firstName: 'first name',
      lastName: 'last name',
    };
    let dto: SignUpDto = plainToInstance(SignUpDto, params);
    let errors = await validate(dto);
    expect(errors).toHaveLength(1);

    params.email = 'invalid email';
    dto = plainToInstance(SignUpDto, params);
    errors = await validate(dto);
    expect(errors).toHaveLength(1);

    params.email = 'valid@email.com';
    dto = plainToInstance(SignUpDto, params);
    errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
