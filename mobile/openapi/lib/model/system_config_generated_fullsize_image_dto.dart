// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigGeneratedFullsizeImageDto {
  const SystemConfigGeneratedFullsizeImageDto({
    required this.enabled,
    required this.format,
    this.progressive,
    required this.quality,
  });

  /// Enabled
  final bool enabled;

  final ImageFormat format;

  /// Progressive
  final bool? progressive;

  /// Quality
  final int quality;

  static const _undefined = Object();

  static SystemConfigGeneratedFullsizeImageDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigGeneratedFullsizeImageDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      enabled: json[r'enabled'] as bool,
      format: (ImageFormat.fromJson(json[r'format']))!,
      progressive: (json[r'progressive'] as bool?),
      quality: json[r'quality'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'enabled'] = enabled;
    json[r'format'] = format.toJson();
    if (progressive != null) {
      json[r'progressive'] = progressive!;
    }
    json[r'quality'] = quality;
    return json;
  }

  SystemConfigGeneratedFullsizeImageDto copyWith({
    bool? enabled,
    ImageFormat? format,
    Object? progressive = _undefined,
    int? quality,
  }) {
    return .new(
      enabled: enabled ?? this.enabled,
      format: format ?? this.format,
      progressive: identical(progressive, _undefined) ? this.progressive : progressive as bool?,
      quality: quality ?? this.quality,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SystemConfigGeneratedFullsizeImageDto &&
            enabled == other.enabled &&
            format == other.format &&
            progressive == other.progressive &&
            quality == other.quality);
  }

  @override
  int get hashCode {
    return Object.hashAll([enabled, format, progressive, quality]);
  }

  @override
  String toString() =>
      'SystemConfigGeneratedFullsizeImageDto(enabled=$enabled, format=$format, progressive=$progressive, quality=$quality)';
}
