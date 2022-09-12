import { AssetResponseDto } from '@api';

export class AssetBucket {
	/**
	 * The DOM height of the bucket in pixel
	 * This value is first estimated by the number of asset and later is corrected as the user scroll
	 */
	bucketHeight!: number;
	bucketDate!: string;
	assets!: AssetResponseDto[];
	cancelToken!: AbortController;
}

export class AssetGridState {
	/**
	 * The total height of the timeline in pixel
	 * This value is first estimated by the number of asset and later is corrected as the user scroll
	 */
	timelineHeight = 0;

	/**
	 * The fixed viewport height in pixel
	 */
	viewportHeight = 0;

	/**
	 * The fixed viewport width in pixel
	 */
	viewportWidth = 0;

	/**
	 * List of bucket information
	 */
	buckets: AssetBucket[] = [];

	/**
	 * Total assets that have been loaded
	 */
	assets: AssetResponseDto[] = [];
}
