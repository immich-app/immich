type CheckAppVersionReponse = {
	shouldShowAnnouncement: boolean;
	localVersion?: string;
	remoteVersion?: string;
};

type GithubRelease = {
	tag_name: string;
};

export const checkAppVersion = async (): Promise<CheckAppVersionReponse> => {
	const res = await fetch('https://api.github.com/repos/alextran1502/immich/releases/latest', {
		headers: {
			Accept: 'application/vnd.github.v3+json',
		},
	});

	if (res.status == 200) {
		const latestRelease = (await res.json()) as GithubRelease;
		const appVersion = localStorage.getItem('appVersion');

		if (!appVersion) {
			return {
				shouldShowAnnouncement: true,
				remoteVersion: latestRelease.tag_name,
				localVersion: 'empty',
			};
		}

		if (appVersion != latestRelease.tag_name) {
			return {
				shouldShowAnnouncement: true,
				remoteVersion: latestRelease.tag_name,
				localVersion: appVersion,
			};
		}

		return {
			shouldShowAnnouncement: false,
			remoteVersion: latestRelease.tag_name,
			localVersion: appVersion,
		};
	} else {
		return {
			shouldShowAnnouncement: false,
			remoteVersion: '0',
			localVersion: '0',
		};
	}
};
