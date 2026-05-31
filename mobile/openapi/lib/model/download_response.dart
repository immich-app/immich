// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class DownloadResponse {
  const DownloadResponse({required this.archiveSize, required this.includeEmbeddedVideos});

  /// Maximum archive size in bytes
  final int archiveSize;

  /// Whether to include embedded videos in downloads
  final bool includeEmbeddedVideos;

  static DownloadResponse? fromJson(dynamic value) {
    ApiCompat.upgrade<DownloadResponse>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      archiveSize: json[r'archiveSize'] as int,
      includeEmbeddedVideos: json[r'includeEmbeddedVideos'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'archiveSize'] = archiveSize;
    json[r'includeEmbeddedVideos'] = includeEmbeddedVideos;
    return json;
  }

  DownloadResponse copyWith({int? archiveSize, bool? includeEmbeddedVideos}) {
    return .new(
      archiveSize: archiveSize ?? this.archiveSize,
      includeEmbeddedVideos: includeEmbeddedVideos ?? this.includeEmbeddedVideos,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is DownloadResponse &&
            archiveSize == other.archiveSize &&
            includeEmbeddedVideos == other.includeEmbeddedVideos);
  }

  @override
  int get hashCode {
    return Object.hashAll([archiveSize, includeEmbeddedVideos]);
  }

  @override
  String toString() => 'DownloadResponse(archiveSize=$archiveSize, includeEmbeddedVideos=$includeEmbeddedVideos)';
}
