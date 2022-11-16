const _basePath = '/api';

export function getFileUrl(assetId: string, isThumb?: boolean, isWeb?: boolean) {
	const urlObj = new URL(`${window.location.origin}${_basePath}/asset/file/${assetId}`);

	if (isThumb !== undefined && isThumb !== null)
		urlObj.searchParams.append('isThumb', `${isThumb}`);
	if (isWeb !== undefined && isWeb !== null) urlObj.searchParams.append('isWeb', `${isWeb}`);

	return urlObj.href;
}
