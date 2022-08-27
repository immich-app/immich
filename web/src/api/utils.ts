import { AssetCountByTimeGroupResponseDto } from '@api';
let _basePath = '/api';

export function getFileUrl(aid: string, did: string, isThumb?: boolean, isWeb?: boolean) {
	const urlObj = new URL(`${window.location.origin}${_basePath}/asset/file`);

	urlObj.searchParams.append('aid', aid);
	urlObj.searchParams.append('did', did);
	if (isThumb !== undefined && isThumb !== null)
		urlObj.searchParams.append('isThumb', `${isThumb}`);
	if (isWeb !== undefined && isWeb !== null) urlObj.searchParams.append('isWeb', `${isWeb}`);

	return urlObj.href;
}

export function calculateTimeLineTotalHeight(
	assetCount: AssetCountByTimeGroupResponseDto,
	viewportWidth: number
) {
	const targetHeight = 235;

	const unwrappedWidth = (3 / 2) * assetCount.totalAssets * targetHeight * (7 / 10);
	const rows = Math.ceil(unwrappedWidth / viewportWidth);
	const height = rows * targetHeight;

	return height;
}
