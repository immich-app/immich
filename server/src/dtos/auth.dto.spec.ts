import { SignUpDto } from 'src/dtos/auth.dto.js';

describe('sign up DTO', () => {
  it('should transform an empty name to null', () => {
    const result = SignUpDto.schema.safeParse({
      email: 'test@test.com',
      password: 'password',
      name: '',
    });
    expect(result.success).toBe(true);
    expect(result.data?.name).toBeNull();
  });

  it('should leave a non-empty name untouched', () => {
    const result = SignUpDto.schema.safeParse({
      email: 'test@test.com',
      password: 'password',
      name: 'Alan Turing',
    });
    expect(result.success).toBe(true);
    expect(result.data?.name).toEqual('Alan Turing');
  });
});
