// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class CreateProfileImageDto {
  const CreateProfileImageDto({required this.file});

  /// Profile image file
  final MultipartFile file;

  static CreateProfileImageDto? fromJson(dynamic value) {
    ApiCompat.upgrade<CreateProfileImageDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(file: (json[r'file'] as MultipartFile?)!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'file'] = file;
    return json;
  }

  CreateProfileImageDto copyWith({MultipartFile? file}) {
    return .new(file: file ?? this.file);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is CreateProfileImageDto && file == other.file);
  }

  @override
  int get hashCode {
    return Object.hashAll([file]);
  }

  @override
  String toString() => 'CreateProfileImageDto(file=$file)';
}
