import 'package:collection/collection.dart';

class DeviceAssetState {
  final List<String> assetIdsForBackup;

  const DeviceAssetState({
    required this.assetIdsForBackup,
  });

  DeviceAssetState copyWith({
    List<String>? assetIdsForBackup,
  }) {
    return DeviceAssetState(
      assetIdsForBackup: assetIdsForBackup ?? this.assetIdsForBackup,
    );
  }

  @override
  String toString() =>
      'DeviceAssetState(assetIdsForBackup: $assetIdsForBackup)';

  @override
  bool operator ==(covariant DeviceAssetState other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return listEquals(other.assetIdsForBackup, assetIdsForBackup);
  }

  @override
  int get hashCode => assetIdsForBackup.hashCode;
}
