import { AssetCountByTimeGroupResponseDto } from '@api';

export function calculateViewportHeight(
	assetCount: AssetCountByTimeGroupResponseDto,
	viewportWidth: number
) {
	const thumbnailHeight = 235;

	const unwrappedWidth = (3 / 2) * assetCount.totalAssets * thumbnailHeight * (7 / 10);
	const rows = Math.ceil(unwrappedWidth / viewportWidth);
	const height = rows * thumbnailHeight;

	return height;
}

/**
 * Calculate section height to identify which section will be loaded when clicked on the scroll bar.
 * Each section is equivalent to month group
 * In each section, there will be segment which is equivalent to day group
 * Example:
 * {
 *    "section": "2022_07_25"
 * }
 *
 *
 * @param assetCount
 * @param viewportWidth
 */
export function calculateSectionHeight(
	assetCount: AssetCountByTimeGroupResponseDto,
	viewportWidth: number
) {}
