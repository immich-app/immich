// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ReverseGeocodingStateResponseDto {
  const ReverseGeocodingStateResponseDto({required this.lastImportFileName, required this.lastUpdate});

  /// Last import file name
  final String? lastImportFileName;

  /// Last update timestamp
  final String? lastUpdate;

  static const _undefined = Object();

  static ReverseGeocodingStateResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ReverseGeocodingStateResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      lastImportFileName: (json[r'lastImportFileName'] as String?),
      lastUpdate: (json[r'lastUpdate'] as String?),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (lastImportFileName != null) {
      json[r'lastImportFileName'] = lastImportFileName!;
    }
    if (lastUpdate != null) {
      json[r'lastUpdate'] = lastUpdate!;
    }
    return json;
  }

  ReverseGeocodingStateResponseDto copyWith({
    Object? lastImportFileName = _undefined,
    Object? lastUpdate = _undefined,
  }) {
    return .new(
      lastImportFileName: identical(lastImportFileName, _undefined)
          ? this.lastImportFileName
          : lastImportFileName as String?,
      lastUpdate: identical(lastUpdate, _undefined) ? this.lastUpdate : lastUpdate as String?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ReverseGeocodingStateResponseDto &&
            lastImportFileName == other.lastImportFileName &&
            lastUpdate == other.lastUpdate);
  }

  @override
  int get hashCode {
    return Object.hashAll([lastImportFileName, lastUpdate]);
  }

  @override
  String toString() =>
      'ReverseGeocodingStateResponseDto(lastImportFileName=$lastImportFileName, lastUpdate=$lastUpdate)';
}
