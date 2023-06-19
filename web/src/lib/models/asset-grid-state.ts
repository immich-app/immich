import type { AssetResponseDto } from '@api';

export enum BucketPosition {
	Above = 'above',
	Below = 'below',
	Visible = 'visible',
	Unknown = 'unknown'
}

export class AssetBucket {
	/**
	 * The DOM height of the bucket in pixel
	 * This value is first estimated by the number of asset and later is corrected as the user scroll
	 */
	bucketHeight!: number;
	bucketDate!: string;
	assets!: AssetResponseDto[];
	cancelToken!: AbortController;
	position!: BucketPosition;
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

	/**
	 * User that owns assets
	 */
	userId: string | undefined;
}
