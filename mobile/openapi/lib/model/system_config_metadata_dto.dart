// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigMetadataDto {
  const SystemConfigMetadataDto({required this.faces});

  final SystemConfigFacesDto faces;

  static SystemConfigMetadataDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigMetadataDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(faces: (SystemConfigFacesDto.fromJson(json[r'faces']))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'faces'] = faces.toJson();
    return json;
  }

  SystemConfigMetadataDto copyWith({SystemConfigFacesDto? faces}) {
    return .new(faces: faces ?? this.faces);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SystemConfigMetadataDto && faces == other.faces);
  }

  @override
  int get hashCode {
    return Object.hashAll([faces]);
  }

  @override
  String toString() => 'SystemConfigMetadataDto(faces=$faces)';
}
