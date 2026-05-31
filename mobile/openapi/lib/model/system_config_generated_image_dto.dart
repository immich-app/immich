// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigGeneratedImageDto {
  const SystemConfigGeneratedImageDto({
    required this.format,
    this.progressive,
    required this.quality,
    required this.size,
  });

  final ImageFormat format;

  /// Progressive
  final bool? progressive;

  /// Quality
  final int quality;

  /// Size
  final int size;

  static const _undefined = Object();

  static SystemConfigGeneratedImageDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigGeneratedImageDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      format: (ImageFormat.fromJson(json[r'format']))!,
      progressive: (json[r'progressive'] as bool?),
      quality: json[r'quality'] as int,
      size: json[r'size'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'format'] = format.toJson();
    if (progressive != null) {
      json[r'progressive'] = progressive!;
    }
    json[r'quality'] = quality;
    json[r'size'] = size;
    return json;
  }

  SystemConfigGeneratedImageDto copyWith({
    ImageFormat? format,
    Object? progressive = _undefined,
    int? quality,
    int? size,
  }) {
    return .new(
      format: format ?? this.format,
      progressive: identical(progressive, _undefined) ? this.progressive : progressive as bool?,
      quality: quality ?? this.quality,
      size: size ?? this.size,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SystemConfigGeneratedImageDto &&
            format == other.format &&
            progressive == other.progressive &&
            quality == other.quality &&
            size == other.size);
  }

  @override
  int get hashCode {
    return Object.hashAll([format, progressive, quality, size]);
  }

  @override
  String toString() =>
      'SystemConfigGeneratedImageDto(format=$format, progressive=$progressive, quality=$quality, size=$size)';
}
