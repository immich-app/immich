// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class VersionCheckStateResponseDto {
  const VersionCheckStateResponseDto({required this.checkedAt, required this.releaseVersion});

  /// Last check timestamp
  final String? checkedAt;

  /// Release version
  final String? releaseVersion;

  static const _undefined = Object();

  static VersionCheckStateResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<VersionCheckStateResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(checkedAt: (json[r'checkedAt'] as String?), releaseVersion: (json[r'releaseVersion'] as String?));
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (checkedAt != null) {
      json[r'checkedAt'] = checkedAt!;
    }
    if (releaseVersion != null) {
      json[r'releaseVersion'] = releaseVersion!;
    }
    return json;
  }

  VersionCheckStateResponseDto copyWith({Object? checkedAt = _undefined, Object? releaseVersion = _undefined}) {
    return .new(
      checkedAt: identical(checkedAt, _undefined) ? this.checkedAt : checkedAt as String?,
      releaseVersion: identical(releaseVersion, _undefined) ? this.releaseVersion : releaseVersion as String?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is VersionCheckStateResponseDto &&
            checkedAt == other.checkedAt &&
            releaseVersion == other.releaseVersion);
  }

  @override
  int get hashCode {
    return Object.hashAll([checkedAt, releaseVersion]);
  }

  @override
  String toString() => 'VersionCheckStateResponseDto(checkedAt=$checkedAt, releaseVersion=$releaseVersion)';
}
