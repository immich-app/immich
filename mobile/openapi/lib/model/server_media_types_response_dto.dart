// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ServerMediaTypesResponseDto {
  const ServerMediaTypesResponseDto({required this.image, required this.sidecar, required this.video});

  /// Supported image MIME types
  final List<String> image;

  /// Supported sidecar MIME types
  final List<String> sidecar;

  /// Supported video MIME types
  final List<String> video;

  static ServerMediaTypesResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ServerMediaTypesResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      image: ((json[r'image'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      sidecar: ((json[r'sidecar'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      video: ((json[r'video'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'image'] = image;
    json[r'sidecar'] = sidecar;
    json[r'video'] = video;
    return json;
  }

  ServerMediaTypesResponseDto copyWith({List<String>? image, List<String>? sidecar, List<String>? video}) {
    return .new(image: image ?? this.image, sidecar: sidecar ?? this.sidecar, video: video ?? this.video);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ServerMediaTypesResponseDto &&
            const DeepCollectionEquality().equals(image, other.image) &&
            const DeepCollectionEquality().equals(sidecar, other.sidecar) &&
            const DeepCollectionEquality().equals(video, other.video));
  }

  @override
  int get hashCode {
    return Object.hashAll([
      const DeepCollectionEquality().hash(image),
      const DeepCollectionEquality().hash(sidecar),
      const DeepCollectionEquality().hash(video),
    ]);
  }

  @override
  String toString() => 'ServerMediaTypesResponseDto(image=$image, sidecar=$sidecar, video=$video)';
}
