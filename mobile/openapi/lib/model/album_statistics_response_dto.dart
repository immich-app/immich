// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AlbumStatisticsResponseDto {
  const AlbumStatisticsResponseDto({required this.notShared, required this.owned, required this.shared});

  /// Number of non-shared albums
  final int notShared;

  /// Number of owned albums
  final int owned;

  /// Number of shared albums
  final int shared;

  static AlbumStatisticsResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AlbumStatisticsResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(notShared: json[r'notShared'] as int, owned: json[r'owned'] as int, shared: json[r'shared'] as int);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'notShared'] = notShared;
    json[r'owned'] = owned;
    json[r'shared'] = shared;
    return json;
  }

  AlbumStatisticsResponseDto copyWith({int? notShared, int? owned, int? shared}) {
    return .new(notShared: notShared ?? this.notShared, owned: owned ?? this.owned, shared: shared ?? this.shared);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AlbumStatisticsResponseDto &&
            notShared == other.notShared &&
            owned == other.owned &&
            shared == other.shared);
  }

  @override
  int get hashCode {
    return Object.hashAll([notShared, owned, shared]);
  }

  @override
  String toString() => 'AlbumStatisticsResponseDto(notShared=$notShared, owned=$owned, shared=$shared)';
}
