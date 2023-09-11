import { AdminSignupResponseDto, AuthDeviceResponseDto, LoginCredentialDto, LoginResponseDto } from '@app/domain';
import { adminSignupStub, loginResponseStub, loginStub, signupResponseStub } from '@test';
import request from 'supertest';

export const authApi = {
  adminSignUp: async (server: any) => {
    const { status, body } = await request(server).post('/auth/admin-sign-up').send(adminSignupStub);

    expect(status).toBe(201);
    expect(body).toEqual(signupResponseStub);

    return body as AdminSignupResponseDto;
  },
  adminLogin: async (server: any) => {
    const { status, body } = await request(server).post('/auth/login').send(loginStub.admin);

    expect(body).toEqual(loginResponseStub.admin.response);
    expect(body).toMatchObject({ accessToken: expect.any(String) });
    expect(status).toBe(201);

    return body as LoginResponseDto;
  },
  login: async (server: any, dto: LoginCredentialDto) => {
    const { status, body } = await request(server).post('/auth/login').send(dto);

    expect(status).toEqual(201);
    expect(body).toMatchObject({ accessToken: expect.any(String) });

    return body as LoginResponseDto;
  },
  getAuthDevices: async (server: any, accessToken: string) => {
    const { status, body } = await request(server).get('/auth/devices').set('Authorization', `Bearer ${accessToken}`);

    expect(body).toEqual(expect.any(Array));
    expect(status).toBe(200);

    return body as AuthDeviceResponseDto[];
  },
  validateToken: async (server: any, accessToken: string) => {
    const { status, body } = await request(server)
      .post('/auth/validateToken')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(body).toEqual({ authStatus: true });
    expect(status).toBe(200);
  },
};
