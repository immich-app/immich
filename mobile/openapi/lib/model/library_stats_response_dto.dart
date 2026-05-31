// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class LibraryStatsResponseDto {
  const LibraryStatsResponseDto({required this.photos, required this.total, required this.usage, required this.videos});

  /// Number of photos
  final int photos;

  /// Total number of assets
  final int total;

  /// Storage usage in bytes
  final int usage;

  /// Number of videos
  final int videos;

  static LibraryStatsResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<LibraryStatsResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      photos: json[r'photos'] as int,
      total: json[r'total'] as int,
      usage: json[r'usage'] as int,
      videos: json[r'videos'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'photos'] = photos;
    json[r'total'] = total;
    json[r'usage'] = usage;
    json[r'videos'] = videos;
    return json;
  }

  LibraryStatsResponseDto copyWith({int? photos, int? total, int? usage, int? videos}) {
    return .new(
      photos: photos ?? this.photos,
      total: total ?? this.total,
      usage: usage ?? this.usage,
      videos: videos ?? this.videos,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is LibraryStatsResponseDto &&
            photos == other.photos &&
            total == other.total &&
            usage == other.usage &&
            videos == other.videos);
  }

  @override
  int get hashCode {
    return Object.hashAll([photos, total, usage, videos]);
  }

  @override
  String toString() => 'LibraryStatsResponseDto(photos=$photos, total=$total, usage=$usage, videos=$videos)';
}
