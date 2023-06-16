import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { LoginCredentialDto } from './login-credential.dto';

describe('LoginCredentialDto', () => {
  it('should allow emails without a tld', () => {
    const someEmail = 'test@test';

    const dto = plainToInstance(LoginCredentialDto, { email: someEmail, password: 'password' });
    const errors = validateSync(dto);
    expect(errors).toHaveLength(0);
    expect(dto.email).toEqual(someEmail);
  });

  it('should fail without an email', () => {
    const dto = plainToInstance(LoginCredentialDto, { password: 'password' });
    const errors = validateSync(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('email');
  });

  it('should fail with an invalid email', () => {
    const dto = plainToInstance(LoginCredentialDto, { email: 'invalid.com', password: 'password' });
    const errors = validateSync(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('email');
  });

  it('should make the email all lowercase', () => {
    const dto = plainToInstance(LoginCredentialDto, { email: 'TeSt@ImMiCh.com', password: 'password' });
    const errors = validateSync(dto);
    expect(errors).toHaveLength(0);
    expect(dto.email).toEqual('test@immich.com');
  });

  it('should fail without a password', () => {
    const dto = plainToInstance(LoginCredentialDto, { email: 'test@immich.com', password: '' });
    const errors = validateSync(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('password');
  });
});
