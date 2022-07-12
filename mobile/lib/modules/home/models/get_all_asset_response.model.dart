import 'package:flutter/foundation.dart';
import 'package:openapi/api.dart';

class ImmichAssetGroupByDate {
  final String date;
  List<AssetResponseDto> assets;
  ImmichAssetGroupByDate({
    required this.date,
    required this.assets,
  });

  ImmichAssetGroupByDate copyWith({
    String? date,
    List<AssetResponseDto>? assets,
  }) {
    return ImmichAssetGroupByDate(
      date: date ?? this.date,
      assets: assets ?? this.assets,
    );
  }

  @override
  String toString() => 'ImmichAssetGroupByDate(date: $date, assets: $assets)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ImmichAssetGroupByDate &&
        other.date == date &&
        listEquals(other.assets, assets);
  }

  @override
  int get hashCode => date.hashCode ^ assets.hashCode;
}

class GetAllAssetResponse {
  final int count;
  final List<ImmichAssetGroupByDate> data;
  final String nextPageKey;
  GetAllAssetResponse({
    required this.count,
    required this.data,
    required this.nextPageKey,
  });

  GetAllAssetResponse copyWith({
    int? count,
    List<ImmichAssetGroupByDate>? data,
    String? nextPageKey,
  }) {
    return GetAllAssetResponse(
      count: count ?? this.count,
      data: data ?? this.data,
      nextPageKey: nextPageKey ?? this.nextPageKey,
    );
  }

  @override
  String toString() =>
      'GetAllAssetResponse(count: $count, data: $data, nextPageKey: $nextPageKey)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is GetAllAssetResponse &&
        other.count == count &&
        listEquals(other.data, data) &&
        other.nextPageKey == nextPageKey;
  }

  @override
  int get hashCode => count.hashCode ^ data.hashCode ^ nextPageKey.hashCode;
}
