// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class DownloadResponseDto {
  const DownloadResponseDto({required this.archives, required this.totalSize});

  /// Archive information
  final List<DownloadArchiveInfo> archives;

  /// Total size in bytes
  final int totalSize;

  static DownloadResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<DownloadResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      archives: ((json[r'archives'] as List?)
          ?.map(($e) => (DownloadArchiveInfo.fromJson($e))!)
          .toList(growable: false))!,
      totalSize: json[r'totalSize'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'archives'] = archives.map(($e) => $e.toJson()).toList(growable: false);
    json[r'totalSize'] = totalSize;
    return json;
  }

  DownloadResponseDto copyWith({List<DownloadArchiveInfo>? archives, int? totalSize}) {
    return .new(archives: archives ?? this.archives, totalSize: totalSize ?? this.totalSize);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is DownloadResponseDto &&
            const DeepCollectionEquality().equals(archives, other.archives) &&
            totalSize == other.totalSize);
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(archives), totalSize]);
  }

  @override
  String toString() => 'DownloadResponseDto(archives=$archives, totalSize=$totalSize)';
}
