import 'package:freezed_annotation/freezed_annotation.dart';

part 'asset_metadata.model.freezed.dart';

enum RemoteAssetMetadataKey {
  mobileApp("mobile-app");

  final String key;

  const RemoteAssetMetadataKey(this.key);
}

abstract class RemoteAssetMetadataValue {
  const RemoteAssetMetadataValue();

  Map<String, dynamic> toJson();
}

class RemoteAssetMetadataItem {
  final RemoteAssetMetadataKey key;
  final RemoteAssetMetadataValue value;

  const RemoteAssetMetadataItem({required this.key, required this.value});

  Map<String, Object?> toJson() {
    return {'key': key.key, 'value': value};
  }
}

@freezed
abstract class RemoteAssetMobileAppMetadata extends RemoteAssetMetadataValue with _$RemoteAssetMobileAppMetadata {
  const factory RemoteAssetMobileAppMetadata({
    String? cloudId,
    String? createdAt,
    String? adjustmentTime,
    String? latitude,
    String? longitude,
  }) = _RemoteAssetMobileAppMetadata;

  const RemoteAssetMobileAppMetadata._();

  @override
  Map<String, dynamic> toJson() => {
    'iCloudId': ?cloudId,
    'createdAt': ?createdAt,
    'adjustmentTime': ?adjustmentTime,
    'latitude': ?latitude,
    'longitude': ?longitude,
  };
}
