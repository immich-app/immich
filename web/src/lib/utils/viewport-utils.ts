/**
 * Glossary
 * 1. Section: Group of assets in a month
 */

export function calculateViewportHeightByNumberOfAsset(assetCount: number, viewportWidth: number) {
	const thumbnailHeight = 235;

	const unwrappedWidth = (3 / 2) * assetCount * thumbnailHeight * (7 / 10);
	const rows = Math.ceil(unwrappedWidth / viewportWidth);
	const height = rows * thumbnailHeight;
	return height;
}
