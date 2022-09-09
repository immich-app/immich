
export function getFileUrl(aid: string, did: string, isThumb?: boolean, isWeb?: boolean) {
	const urlObj = new URL(`${getAPIServerUrl()}/asset/file`);

	urlObj.searchParams.append('aid', aid);
	urlObj.searchParams.append('did', did);
	if (isThumb !== undefined && isThumb !== null)
		urlObj.searchParams.append('isThumb', `${isThumb}`);
	if (isWeb !== undefined && isWeb !== null) urlObj.searchParams.append('isWeb', `${isWeb}`);

	return urlObj.href;
}

export function getAPIServerUrl(){
	return env.IMMICH_SERVER_URL || "http://immich-server:3001/api";
}

export function getBackendURL() {
	return env.IMMICH_WEB_URL || "/api";
}