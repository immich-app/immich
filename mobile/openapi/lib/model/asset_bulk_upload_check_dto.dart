// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetBulkUploadCheckDto {
  const AssetBulkUploadCheckDto({required this.assets});

  /// Assets to check
  final List<AssetBulkUploadCheckItem> assets;

  static AssetBulkUploadCheckDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetBulkUploadCheckDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assets: ((json[r'assets'] as List?)
          ?.map(($e) => (AssetBulkUploadCheckItem.fromJson($e))!)
          .toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assets'] = assets.map(($e) => $e.toJson()).toList(growable: false);
    return json;
  }

  AssetBulkUploadCheckDto copyWith({List<AssetBulkUploadCheckItem>? assets}) {
    return .new(assets: assets ?? this.assets);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetBulkUploadCheckDto && const DeepCollectionEquality().equals(assets, other.assets));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(assets)]);
  }

  @override
  String toString() => 'AssetBulkUploadCheckDto(assets=$assets)';
}
