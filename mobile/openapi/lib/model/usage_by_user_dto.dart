// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class UsageByUserDto {
  const UsageByUserDto({
    required this.photos,
    required this.quotaSizeInBytes,
    required this.usage,
    required this.usagePhotos,
    required this.usageVideos,
    required this.userId,
    required this.userName,
    required this.videos,
  });

  /// Number of photos
  final int photos;

  /// User quota size in bytes (null if unlimited)
  final int? quotaSizeInBytes;

  /// Total storage usage in bytes
  final int usage;

  /// Storage usage for photos in bytes
  final int usagePhotos;

  /// Storage usage for videos in bytes
  final int usageVideos;

  /// User ID
  final String userId;

  /// User name
  final String userName;

  /// Number of videos
  final int videos;

  static const _undefined = Object();

  static UsageByUserDto? fromJson(dynamic value) {
    ApiCompat.upgrade<UsageByUserDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      photos: json[r'photos'] as int,
      quotaSizeInBytes: (json[r'quotaSizeInBytes'] as int?),
      usage: json[r'usage'] as int,
      usagePhotos: json[r'usagePhotos'] as int,
      usageVideos: json[r'usageVideos'] as int,
      userId: json[r'userId'] as String,
      userName: json[r'userName'] as String,
      videos: json[r'videos'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'photos'] = photos;
    if (quotaSizeInBytes != null) {
      json[r'quotaSizeInBytes'] = quotaSizeInBytes!;
    }
    json[r'usage'] = usage;
    json[r'usagePhotos'] = usagePhotos;
    json[r'usageVideos'] = usageVideos;
    json[r'userId'] = userId;
    json[r'userName'] = userName;
    json[r'videos'] = videos;
    return json;
  }

  UsageByUserDto copyWith({
    int? photos,
    Object? quotaSizeInBytes = _undefined,
    int? usage,
    int? usagePhotos,
    int? usageVideos,
    String? userId,
    String? userName,
    int? videos,
  }) {
    return .new(
      photos: photos ?? this.photos,
      quotaSizeInBytes: identical(quotaSizeInBytes, _undefined) ? this.quotaSizeInBytes : quotaSizeInBytes as int?,
      usage: usage ?? this.usage,
      usagePhotos: usagePhotos ?? this.usagePhotos,
      usageVideos: usageVideos ?? this.usageVideos,
      userId: userId ?? this.userId,
      userName: userName ?? this.userName,
      videos: videos ?? this.videos,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is UsageByUserDto &&
            photos == other.photos &&
            quotaSizeInBytes == other.quotaSizeInBytes &&
            usage == other.usage &&
            usagePhotos == other.usagePhotos &&
            usageVideos == other.usageVideos &&
            userId == other.userId &&
            userName == other.userName &&
            videos == other.videos);
  }

  @override
  int get hashCode {
    return Object.hashAll([photos, quotaSizeInBytes, usage, usagePhotos, usageVideos, userId, userName, videos]);
  }

  @override
  String toString() =>
      'UsageByUserDto(photos=$photos, quotaSizeInBytes=$quotaSizeInBytes, usage=$usage, usagePhotos=$usagePhotos, usageVideos=$usageVideos, userId=$userId, userName=$userName, videos=$videos)';
}
