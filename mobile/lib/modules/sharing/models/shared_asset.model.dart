import 'dart:convert';

import 'package:immich_mobile/shared/models/immich_asset.model.dart';

class SharedAssets {
  final ImmichAsset assetInfo;

  SharedAssets({
    required this.assetInfo,
  });

  SharedAssets copyWith({
    ImmichAsset? assetInfo,
  }) {
    return SharedAssets(
      assetInfo: assetInfo ?? this.assetInfo,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'assetInfo': assetInfo.toMap()});

    return result;
  }

  factory SharedAssets.fromMap(Map<String, dynamic> map) {
    return SharedAssets(
      assetInfo: ImmichAsset.fromMap(map['assetInfo']),
    );
  }

  String toJson() => json.encode(toMap());

  factory SharedAssets.fromJson(String source) => SharedAssets.fromMap(json.decode(source));

  @override
  String toString() => 'SharedAssets(assetInfo: $assetInfo)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is SharedAssets && other.assetInfo == assetInfo;
  }

  @override
  int get hashCode => assetInfo.hashCode;
}
