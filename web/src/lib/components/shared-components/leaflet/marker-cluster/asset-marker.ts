import { MapMarkerResponseDto, api } from '@api';
import { Marker, Map, Icon } from 'leaflet';

export default class AssetMarker extends Marker {
	id: string;
	private iconCreated = false;

	constructor(marker: MapMarkerResponseDto) {
		super([marker.lat, marker.lon]);
		this.id = marker.id;
	}

	onAdd(map: Map) {
		// Set icon when the marker gets actually added to the map. This only
		// gets called for individual assets and when selecting a cluster, so
		// creating an icon for every marker in advance is pretty wasteful.
		if (!this.iconCreated) {
			this.iconCreated = true;
			this.setIcon(this.getIcon());
		}

		return super.onAdd(map);
	}

	getIcon() {
		return new Icon({
			iconUrl: api.getAssetThumbnailUrl(this.id),
			iconRetinaUrl: api.getAssetThumbnailUrl(this.id),
			iconSize: [60, 60],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34],
			tooltipAnchor: [16, -28],
			shadowSize: [41, 41],
			className: 'asset-marker-icon'
		});
	}
}
