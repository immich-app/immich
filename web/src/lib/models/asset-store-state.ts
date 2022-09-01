import { AssetResponseDto } from '@api';
import lodash from 'lodash-es';
import moment from 'moment';

export class AssetStoreState {
	segmentDate!: string;
	segmentHeight!: number;
	assets!: AssetResponseDto[];

	public get assetsGroupByDate(): AssetResponseDto[][] {
		try {
			return lodash
				.chain(this.assets)
				.groupBy((a) => moment(a.createdAt).format('ddd, MMM DD YYYY'))
				.sortBy((group) => this.assets.indexOf(group[0]))
				.value();
		} catch (e) {
			return [];
		}
	}
}
