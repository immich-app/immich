import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { SignUpDto } from './sign-up.dto';

describe('SignUpDto', () => {
  it('should require all fields', () => {
    let dto = plainToInstance(SignUpDto, {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    });
    let errors = validateSync(dto);
    expect(errors).toHaveLength(4);
    expect(errors[0].property).toEqual('email');
    expect(errors[1].property).toEqual('password');
    expect(errors[2].property).toEqual('firstName');
    expect(errors[3].property).toEqual('lastName');
  });

  it('should require a valid email', () => {
    let dto = plainToInstance(SignUpDto, {
      email: 'immich.com',
      password: 'password',
      firstName: 'first name',
      lastName: 'last name',
    });
    let errors = validateSync(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('email');
  });

  it('should make the email all lowercase', () => {
    let dto = plainToInstance(SignUpDto, {
      email: 'TeSt@ImMiCh.com',
      password: 'password',
      firstName: 'first name',
      lastName: 'last name',
    });
    let errors = validateSync(dto);
    expect(errors).toHaveLength(0);
    expect(dto.email).toEqual('test@immich.com');
  });
});
