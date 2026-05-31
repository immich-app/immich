// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AlbumsResponse {
  const AlbumsResponse({required this.defaultAssetOrder});

  final AssetOrder defaultAssetOrder;

  static AlbumsResponse? fromJson(dynamic value) {
    ApiCompat.upgrade<AlbumsResponse>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(defaultAssetOrder: (AssetOrder.fromJson(json[r'defaultAssetOrder']))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'defaultAssetOrder'] = defaultAssetOrder.toJson();
    return json;
  }

  AlbumsResponse copyWith({AssetOrder? defaultAssetOrder}) {
    return .new(defaultAssetOrder: defaultAssetOrder ?? this.defaultAssetOrder);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is AlbumsResponse && defaultAssetOrder == other.defaultAssetOrder);
  }

  @override
  int get hashCode {
    return Object.hashAll([defaultAssetOrder]);
  }

  @override
  String toString() => 'AlbumsResponse(defaultAssetOrder=$defaultAssetOrder)';
}
