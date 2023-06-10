import type { Translation } from '../i18n-types'

const cn = {
	HI: '你好 世界!',
	word: {
		photos: '照片',
		explore: '探索',
		map: '地图',
		sharing: '分享',
		library: 'Library',
		favorites: '收藏夹',
		albums: '相册',
		archive: '归档',
		storage: '存储',
		server: '服务器',
		status: '状态',
		version: '版本',
		online: '在线',
		offline: '离线',
		upload: '上传',
		administration: '系统管理',
		settings: '设置',
	},
	account: {
		account_settings: '账户设置',
		sign_in: '登录',
		sign_out: '退出登录',
	},
	user_settings: {
		account: '账户',
		account_subtitle: '管理您的账户',
		api_keys: 'API密钥',
		api_keys_subtitle: '管理您的API密钥',
		authorized_devices: '授权设备',
		authorized_devices_subtitle: '管理您登录的设备',
		oauth: 'OAuth',
		oauth_subtitle: '管理您的OAuth连接',
		password: '密码',
		password_subtitle: '更改您的密码',
		sharing_subtitle: '管理与合作伙伴的共享'
	},
	storage: {
		usage: '{usedSpace} of {totalSpace} 已使用'
	},
} satisfies Translation

export default cn