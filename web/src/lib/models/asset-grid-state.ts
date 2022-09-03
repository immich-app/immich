import { AssetResponseDto } from '@api';

export class AssetBucket {
	/**
	 * The DOM height of the bucket in pixel
	 * This value is first estimated by the number of asset and later is corrected as the user scroll
	 */
	bucketHeight: number = 0;
	bucketDate: string = '';
	assets: AssetResponseDto[] = [];
}

export class AssetGridState {
	/**
	 * The total height of the timeline in pixel
	 * This value is first estimated by the number of asset and later is corrected as the user scroll
	 */
	timelineHeight: number = 0;

	/**
	 * The fixed viewport height in pixel
	 */
	viewportHeight: number = 0;

	/**
	 * The fixed viewport width in pixel
	 */
	viewportWidth: number = 0;

	/**
	 * List of bucket information
	 */
	buckets: AssetBucket[] = [];

	/**
	 * Total assets that have been loaded
	 */
	assets: AssetResponseDto[] = [];
}
