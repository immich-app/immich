// ignore_for_file: add-copy-with

sealed class MapEvent {
  const MapEvent();
}

class MapAssetsInBoundsUpdated extends MapEvent {
  final List<String> assetRemoteIds;

  const MapAssetsInBoundsUpdated(this.assetRemoteIds);
}

class MapCloseBottomSheet extends MapEvent {}
