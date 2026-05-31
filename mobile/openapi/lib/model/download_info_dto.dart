// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class DownloadInfoDto {
  const DownloadInfoDto({
    this.albumId = const Optional.absent(),
    this.archiveSize = const Optional.absent(),
    this.assetIds = const Optional.absent(),
    this.userId = const Optional.absent(),
  });

  /// Album ID to download
  final Optional<String> albumId;

  /// Archive size limit in bytes
  final Optional<int> archiveSize;

  /// Asset IDs to download
  final Optional<List<String>> assetIds;

  /// User ID to download assets from
  final Optional<String> userId;

  static DownloadInfoDto? fromJson(dynamic value) {
    ApiCompat.upgrade<DownloadInfoDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      albumId: json.containsKey(r'albumId') ? Optional.present(json[r'albumId'] as String) : const Optional.absent(),
      archiveSize: json.containsKey(r'archiveSize')
          ? Optional.present(json[r'archiveSize'] as int)
          : const Optional.absent(),
      assetIds: json.containsKey(r'assetIds')
          ? Optional.present(((json[r'assetIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!)
          : const Optional.absent(),
      userId: json.containsKey(r'userId') ? Optional.present(json[r'userId'] as String) : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (albumId case Present(:final value)) {
      json[r'albumId'] = value;
    }
    if (archiveSize case Present(:final value)) {
      json[r'archiveSize'] = value;
    }
    if (assetIds case Present(:final value)) {
      json[r'assetIds'] = value;
    }
    if (userId case Present(:final value)) {
      json[r'userId'] = value;
    }
    return json;
  }

  DownloadInfoDto copyWith({
    Optional<String>? albumId,
    Optional<int>? archiveSize,
    Optional<List<String>>? assetIds,
    Optional<String>? userId,
  }) {
    return .new(
      albumId: albumId ?? this.albumId,
      archiveSize: archiveSize ?? this.archiveSize,
      assetIds: assetIds ?? this.assetIds,
      userId: userId ?? this.userId,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is DownloadInfoDto &&
            albumId == other.albumId &&
            archiveSize == other.archiveSize &&
            assetIds == other.assetIds &&
            userId == other.userId);
  }

  @override
  int get hashCode {
    return Object.hashAll([albumId, archiveSize, assetIds, userId]);
  }

  @override
  String toString() =>
      'DownloadInfoDto(albumId=$albumId, archiveSize=$archiveSize, assetIds=$assetIds, userId=$userId)';
}
