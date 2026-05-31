// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Album preferences
final class AlbumsUpdate {
  const AlbumsUpdate({this.defaultAssetOrder});

  final AssetOrder? defaultAssetOrder;

  static const _undefined = Object();

  static AlbumsUpdate? fromJson(dynamic value) {
    ApiCompat.upgrade<AlbumsUpdate>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(defaultAssetOrder: AssetOrder.fromJson(json[r'defaultAssetOrder']));
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (defaultAssetOrder != null) {
      json[r'defaultAssetOrder'] = defaultAssetOrder!.toJson();
    }
    return json;
  }

  AlbumsUpdate copyWith({Object? defaultAssetOrder = _undefined}) {
    return .new(
      defaultAssetOrder: identical(defaultAssetOrder, _undefined)
          ? this.defaultAssetOrder
          : defaultAssetOrder as AssetOrder?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is AlbumsUpdate && defaultAssetOrder == other.defaultAssetOrder);
  }

  @override
  int get hashCode {
    return Object.hashAll([defaultAssetOrder]);
  }

  @override
  String toString() => 'AlbumsUpdate(defaultAssetOrder=$defaultAssetOrder)';
}
