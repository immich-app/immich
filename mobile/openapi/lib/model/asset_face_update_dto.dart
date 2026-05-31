// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetFaceUpdateDto {
  const AssetFaceUpdateDto({required this.data});

  /// Face update items
  final List<AssetFaceUpdateItem> data;

  static AssetFaceUpdateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetFaceUpdateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      data: ((json[r'data'] as List?)?.map(($e) => (AssetFaceUpdateItem.fromJson($e))!).toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'data'] = data.map(($e) => $e.toJson()).toList(growable: false);
    return json;
  }

  AssetFaceUpdateDto copyWith({List<AssetFaceUpdateItem>? data}) {
    return .new(data: data ?? this.data);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetFaceUpdateDto && const DeepCollectionEquality().equals(data, other.data));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(data)]);
  }

  @override
  String toString() => 'AssetFaceUpdateDto(data=$data)';
}
