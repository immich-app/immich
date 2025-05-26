import 'dart:typed_data';

class DeviceAsset {
  final String assetId;
  final Uint8List hash;
  final DateTime modifiedTime;

  const DeviceAsset({
    required this.assetId,
    required this.hash,
    required this.modifiedTime,
  });

  @override
  bool operator ==(covariant DeviceAsset other) {
    if (identical(this, other)) return true;

    return other.assetId == assetId &&
        other.hash == hash &&
        other.modifiedTime == modifiedTime;
  }

  @override
  int get hashCode {
    return assetId.hashCode ^ hash.hashCode ^ modifiedTime.hashCode;
  }

  @override
  String toString() {
    return 'DeviceAsset(assetId: $assetId, hash: $hash, modifiedTime: $modifiedTime)';
  }

  DeviceAsset copyWith({
    String? assetId,
    Uint8List? hash,
    DateTime? modifiedTime,
  }) {
    return DeviceAsset(
      assetId: assetId ?? this.assetId,
      hash: hash ?? this.hash,
      modifiedTime: modifiedTime ?? this.modifiedTime,
    );
  }
}
