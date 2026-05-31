// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class DownloadArchiveDto {
  const DownloadArchiveDto({required this.assetIds, this.edited = const Optional.absent()});

  /// Asset IDs
  final List<String> assetIds;

  /// Download edited asset if available
  final Optional<bool> edited;

  static DownloadArchiveDto? fromJson(dynamic value) {
    ApiCompat.upgrade<DownloadArchiveDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assetIds: ((json[r'assetIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      edited: json.containsKey(r'edited') ? Optional.present(json[r'edited'] as bool) : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetIds'] = assetIds;
    if (edited case Present(:final value)) {
      json[r'edited'] = value;
    }
    return json;
  }

  DownloadArchiveDto copyWith({List<String>? assetIds, Optional<bool>? edited}) {
    return .new(assetIds: assetIds ?? this.assetIds, edited: edited ?? this.edited);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is DownloadArchiveDto &&
            const DeepCollectionEquality().equals(assetIds, other.assetIds) &&
            edited == other.edited);
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(assetIds), edited]);
  }

  @override
  String toString() => 'DownloadArchiveDto(assetIds=$assetIds, edited=$edited)';
}
