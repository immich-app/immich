// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class DownloadArchiveInfo {
  const DownloadArchiveInfo({required this.assetIds, required this.size});

  /// Asset IDs in this archive
  final List<String> assetIds;

  /// Archive size in bytes
  final int size;

  static DownloadArchiveInfo? fromJson(dynamic value) {
    ApiCompat.upgrade<DownloadArchiveInfo>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assetIds: ((json[r'assetIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      size: json[r'size'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetIds'] = assetIds;
    json[r'size'] = size;
    return json;
  }

  DownloadArchiveInfo copyWith({List<String>? assetIds, int? size}) {
    return .new(assetIds: assetIds ?? this.assetIds, size: size ?? this.size);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is DownloadArchiveInfo &&
            const DeepCollectionEquality().equals(assetIds, other.assetIds) &&
            size == other.size);
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(assetIds), size]);
  }

  @override
  String toString() => 'DownloadArchiveInfo(assetIds=$assetIds, size=$size)';
}
