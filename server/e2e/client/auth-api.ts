import { LoginResponseDto } from 'src/domain/auth/auth.dto';
import { UserResponseDto } from 'src/domain/user/response-dto/user-response.dto';
import request from 'supertest';
import { adminSignupStub, loginResponseStub, loginStub } from 'test/fixtures/auth.stub';

export const authApi = {
  adminSignUp: async (server: any) => {
    const { status, body } = await request(server).post('/auth/admin-sign-up').send(adminSignupStub);

    expect(status).toBe(201);

    return body as UserResponseDto;
  },
  adminLogin: async (server: any) => {
    const { status, body } = await request(server).post('/auth/login').send(loginStub.admin);

    expect(body).toEqual(loginResponseStub.admin.response);
    expect(body).toMatchObject({ accessToken: expect.any(String) });
    expect(status).toBe(201);

    return body as LoginResponseDto;
  },
};
