// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetStatsResponseDto {
  const AssetStatsResponseDto({required this.images, required this.total, required this.videos});

  /// Number of images
  final int images;

  /// Total number of assets
  final int total;

  /// Number of videos
  final int videos;

  static AssetStatsResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetStatsResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(images: json[r'images'] as int, total: json[r'total'] as int, videos: json[r'videos'] as int);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'images'] = images;
    json[r'total'] = total;
    json[r'videos'] = videos;
    return json;
  }

  AssetStatsResponseDto copyWith({int? images, int? total, int? videos}) {
    return .new(images: images ?? this.images, total: total ?? this.total, videos: videos ?? this.videos);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetStatsResponseDto && images == other.images && total == other.total && videos == other.videos);
  }

  @override
  int get hashCode {
    return Object.hashAll([images, total, videos]);
  }

  @override
  String toString() => 'AssetStatsResponseDto(images=$images, total=$total, videos=$videos)';
}
