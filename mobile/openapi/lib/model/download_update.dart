// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class DownloadUpdate {
  const DownloadUpdate({this.archiveSize, this.includeEmbeddedVideos});

  /// Maximum archive size in bytes
  final int? archiveSize;

  /// Whether to include embedded videos in downloads
  final bool? includeEmbeddedVideos;

  static const _undefined = Object();

  static DownloadUpdate? fromJson(dynamic value) {
    ApiCompat.upgrade<DownloadUpdate>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      archiveSize: (json[r'archiveSize'] as int?),
      includeEmbeddedVideos: (json[r'includeEmbeddedVideos'] as bool?),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (archiveSize != null) {
      json[r'archiveSize'] = archiveSize!;
    }
    if (includeEmbeddedVideos != null) {
      json[r'includeEmbeddedVideos'] = includeEmbeddedVideos!;
    }
    return json;
  }

  DownloadUpdate copyWith({Object? archiveSize = _undefined, Object? includeEmbeddedVideos = _undefined}) {
    return .new(
      archiveSize: identical(archiveSize, _undefined) ? this.archiveSize : archiveSize as int?,
      includeEmbeddedVideos: identical(includeEmbeddedVideos, _undefined)
          ? this.includeEmbeddedVideos
          : includeEmbeddedVideos as bool?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is DownloadUpdate &&
            archiveSize == other.archiveSize &&
            includeEmbeddedVideos == other.includeEmbeddedVideos);
  }

  @override
  int get hashCode {
    return Object.hashAll([archiveSize, includeEmbeddedVideos]);
  }

  @override
  String toString() => 'DownloadUpdate(archiveSize=$archiveSize, includeEmbeddedVideos=$includeEmbeddedVideos)';
}
