import { api, UserResponseDto } from '@api';
import { goto } from '$app/navigation';

export async function checkUserAuthStatus(session: App.Session, redirectToPhotos = false, redirectToLogin = true): Promise<UserResponseDto>  {

    if (session.user) return session.user;

	try {
		const { data } = await api.userApi.getMyUserInfo();
		session.user = data;

        if (redirectToPhotos) goto('/photos');

        return data;
	} catch (e) {
        if (redirectToLogin) goto('/auth/login');

        throw 'Not logged in!';
	}
};