import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateUserDto } from './update-user.dto';

describe('update user DTO', () => {
  it('should allow emails without a tld', async () => {
    const someEmail = 'test@test';

    const dto = plainToInstance(UpdateUserDto, {
      email: someEmail,
      id: '3fe388e4-2078-44d7-b36c-39d9dee3a657',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.email).toEqual(someEmail);
  });
});
