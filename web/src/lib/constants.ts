import { env } from '$env/dynamic/public';
export const loginPageMessage: string | undefined = env.PUBLIC_LOGIN_PAGE_MESSAGE;

export enum AppRoute {
	ADMIN_USER_MANAGEMENT = '/admin/user-management',
	ADMIN_SETTINGS = '/admin/system-settings',
	ADMIN_STATS = '/admin/server-status',
	ADMIN_JOBS = '/admin/jobs-status',

	ALBUMS = '/albums',
	ARCHIVE = '/archive',
	FAVORITES = '/favorites',
	PEOPLE = '/people',
	PHOTOS = '/photos',
	EXPLORE = '/explore',
	SHARING = '/sharing',
	SHARED_LINKS = '/sharing/sharedlinks',
	SEARCH = '/search',
	MAP = '/map',
	USER_SETTINGS = '/user-settings',

	AUTH_LOGIN = '/auth/login',
	AUTH_LOGOUT = '/auth/logout',
	AUTH_REGISTER = '/auth/register',
	AUTH_CHANGE_PASSWORD = '/auth/change-password'
}
