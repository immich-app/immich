import 'package:immich_mobile/shared/models/asset.dart';

enum MapPageEventType {
  mapTap,
  bottomSheetScrolled,
  assetsInBoundUpdated,
  zoomToAsset,
  zoomToCurrentLocation,
}

class MapPageEventBase {
  final MapPageEventType type;

  const MapPageEventBase(this.type);
}

class MapPageOnTapEvent extends MapPageEventBase {
  const MapPageOnTapEvent() : super(MapPageEventType.mapTap);
}

class MapPageAssetsInBoundUpdated extends MapPageEventBase {
  List<Asset> assets;
  MapPageAssetsInBoundUpdated(this.assets)
      : super(MapPageEventType.assetsInBoundUpdated);
}

class MapPageBottomSheetScrolled extends MapPageEventBase {
  Asset? asset;
  MapPageBottomSheetScrolled(this.asset)
      : super(MapPageEventType.bottomSheetScrolled);
}

class MapPageZoomToAsset extends MapPageEventBase {
  Asset? asset;
  MapPageZoomToAsset(this.asset) : super(MapPageEventType.zoomToAsset);
}

class MapPageZoomToLocation extends MapPageEventBase {
  const MapPageZoomToLocation() : super(MapPageEventType.zoomToCurrentLocation);
}
