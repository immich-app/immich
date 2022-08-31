import { AssetResponseDto } from '@api';

export class AssetStoreState {
	segmentDate!: string;
	segmentHeight!: number;
	assets!: AssetResponseDto[];
	assetsGroupByDate!: AssetResponseDto[][];
}
