// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ServerStatsResponseDto {
  const ServerStatsResponseDto({
    required this.photos,
    required this.usage,
    required this.usageByUser,
    required this.usagePhotos,
    required this.usageVideos,
    required this.videos,
  });

  /// Total number of photos
  final int photos;

  /// Total storage usage in bytes
  final int usage;

  /// Array of usage for each user
  final List<UsageByUserDto> usageByUser;

  /// Storage usage for photos in bytes
  final int usagePhotos;

  /// Storage usage for videos in bytes
  final int usageVideos;

  /// Total number of videos
  final int videos;

  static ServerStatsResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ServerStatsResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      photos: json[r'photos'] as int,
      usage: json[r'usage'] as int,
      usageByUser: ((json[r'usageByUser'] as List?)
          ?.map(($e) => (UsageByUserDto.fromJson($e))!)
          .toList(growable: false))!,
      usagePhotos: json[r'usagePhotos'] as int,
      usageVideos: json[r'usageVideos'] as int,
      videos: json[r'videos'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'photos'] = photos;
    json[r'usage'] = usage;
    json[r'usageByUser'] = usageByUser.map(($e) => $e.toJson()).toList(growable: false);
    json[r'usagePhotos'] = usagePhotos;
    json[r'usageVideos'] = usageVideos;
    json[r'videos'] = videos;
    return json;
  }

  ServerStatsResponseDto copyWith({
    int? photos,
    int? usage,
    List<UsageByUserDto>? usageByUser,
    int? usagePhotos,
    int? usageVideos,
    int? videos,
  }) {
    return .new(
      photos: photos ?? this.photos,
      usage: usage ?? this.usage,
      usageByUser: usageByUser ?? this.usageByUser,
      usagePhotos: usagePhotos ?? this.usagePhotos,
      usageVideos: usageVideos ?? this.usageVideos,
      videos: videos ?? this.videos,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ServerStatsResponseDto &&
            photos == other.photos &&
            usage == other.usage &&
            const DeepCollectionEquality().equals(usageByUser, other.usageByUser) &&
            usagePhotos == other.usagePhotos &&
            usageVideos == other.usageVideos &&
            videos == other.videos);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      photos,
      usage,
      const DeepCollectionEquality().hash(usageByUser),
      usagePhotos,
      usageVideos,
      videos,
    ]);
  }

  @override
  String toString() =>
      'ServerStatsResponseDto(photos=$photos, usage=$usage, usageByUser=$usageByUser, usagePhotos=$usagePhotos, usageVideos=$usageVideos, videos=$videos)';
}
