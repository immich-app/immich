// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetIdsResponseDto {
  const AssetIdsResponseDto({required this.assetId, this.error, required this.success});

  /// Asset ID
  final String assetId;

  final AssetIdErrorReason? error;

  /// Whether operation succeeded
  final bool success;

  static const _undefined = Object();

  static AssetIdsResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetIdsResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assetId: json[r'assetId'] as String,
      error: AssetIdErrorReason.fromJson(json[r'error']),
      success: json[r'success'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetId'] = assetId;
    if (error != null) {
      json[r'error'] = error!.toJson();
    }
    json[r'success'] = success;
    return json;
  }

  AssetIdsResponseDto copyWith({String? assetId, Object? error = _undefined, bool? success}) {
    return .new(
      assetId: assetId ?? this.assetId,
      error: identical(error, _undefined) ? this.error : error as AssetIdErrorReason?,
      success: success ?? this.success,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetIdsResponseDto && assetId == other.assetId && error == other.error && success == other.success);
  }

  @override
  int get hashCode {
    return Object.hashAll([assetId, error, success]);
  }

  @override
  String toString() => 'AssetIdsResponseDto(assetId=$assetId, error=$error, success=$success)';
}
