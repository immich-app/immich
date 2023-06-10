import type { BaseTranslation } from '../i18n-types'

const en = {
	HI: 'Hello World!',
	word: {
		photos: 'Photos',
		explore: 'Explore',
		map: 'Map',
		sharing: 'Sharing',
		library: 'Library',
		favorites: 'Favorites',
		albums: 'Albums',
		archive: 'Archive',
		storage: 'Storage',
		server: 'Server',
		status: 'Status',
		version: 'Version',
		online: 'Online',
		offline: 'Offline',
		upload: 'Upload',
		administration: 'Administration',
		settings: 'Settings',
	},
	account: {
		account_settings: 'Account Settings',
		sign_in: 'Sign In',
		sign_out: 'Sign Out',
	},
	user_settings: {
		account: 'Account',
		account_subtitle: 'Manage your account',
		api_keys: 'API Keys',
		api_keys_subtitle: 'Manage your API keys',
		authorized_devices: 'Authorized Devices',
		authorized_devices_subtitle: 'Manage your logged-in devices',
		oauth: 'Oauth',
		oauth_subtitle: 'Manage your OAuth connection',
		password: 'Password',
		password_subtitle: 'Change your password',
		sharing_subtitle: 'Manage sharing with partners'
	},
	storage: {
		usage: '{usedSpace} of {totalSpace} Used'
	},
} satisfies BaseTranslation

export default en