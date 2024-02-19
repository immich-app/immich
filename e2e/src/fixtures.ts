export const uuidDto = {
  invalid: 'invalid-uuid',
  // valid uuid v4
  notFound: '00000000-0000-4000-a000-000000000000',
};

const adminLoginDto = {
  email: 'admin@immich.cloud',
  password: 'password',
};
const adminSignupDto = { ...adminLoginDto, name: 'Immich Admin' };

export const loginDto = {
  admin: adminLoginDto,
};

export const signupDto = {
  admin: adminSignupDto,
};
