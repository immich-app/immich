// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigImageDto {
  const SystemConfigImageDto({
    required this.colorspace,
    required this.extractEmbedded,
    required this.fullsize,
    required this.preview,
    required this.thumbnail,
  });

  final Colorspace colorspace;

  /// Extract embedded
  final bool extractEmbedded;

  final SystemConfigGeneratedFullsizeImageDto fullsize;

  final SystemConfigGeneratedImageDto preview;

  final SystemConfigGeneratedImageDto thumbnail;

  static SystemConfigImageDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigImageDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      colorspace: (Colorspace.fromJson(json[r'colorspace']))!,
      extractEmbedded: json[r'extractEmbedded'] as bool,
      fullsize: (SystemConfigGeneratedFullsizeImageDto.fromJson(json[r'fullsize']))!,
      preview: (SystemConfigGeneratedImageDto.fromJson(json[r'preview']))!,
      thumbnail: (SystemConfigGeneratedImageDto.fromJson(json[r'thumbnail']))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'colorspace'] = colorspace.toJson();
    json[r'extractEmbedded'] = extractEmbedded;
    json[r'fullsize'] = fullsize.toJson();
    json[r'preview'] = preview.toJson();
    json[r'thumbnail'] = thumbnail.toJson();
    return json;
  }

  SystemConfigImageDto copyWith({
    Colorspace? colorspace,
    bool? extractEmbedded,
    SystemConfigGeneratedFullsizeImageDto? fullsize,
    SystemConfigGeneratedImageDto? preview,
    SystemConfigGeneratedImageDto? thumbnail,
  }) {
    return .new(
      colorspace: colorspace ?? this.colorspace,
      extractEmbedded: extractEmbedded ?? this.extractEmbedded,
      fullsize: fullsize ?? this.fullsize,
      preview: preview ?? this.preview,
      thumbnail: thumbnail ?? this.thumbnail,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SystemConfigImageDto &&
            colorspace == other.colorspace &&
            extractEmbedded == other.extractEmbedded &&
            fullsize == other.fullsize &&
            preview == other.preview &&
            thumbnail == other.thumbnail);
  }

  @override
  int get hashCode {
    return Object.hashAll([colorspace, extractEmbedded, fullsize, preview, thumbnail]);
  }

  @override
  String toString() =>
      'SystemConfigImageDto(colorspace=$colorspace, extractEmbedded=$extractEmbedded, fullsize=$fullsize, preview=$preview, thumbnail=$thumbnail)';
}
