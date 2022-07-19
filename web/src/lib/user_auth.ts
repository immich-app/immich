import { api, UserResponseDto } from '@api';
import { goto } from '$app/navigation';

export async function checkUserAuthStatus(session: App.Session): Promise<UserResponseDto>  {

    if (session.user) return session.user;

	const { data } = await api.userApi.getMyUserInfo();
    session.user = data;

    return data;
};

export function gotoLogin() {
    goto('/auth/login');
}