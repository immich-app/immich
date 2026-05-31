// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class DatabaseBackupUploadDto {
  const DatabaseBackupUploadDto({this.file});

  /// Database backup file
  final MultipartFile? file;

  static const _undefined = Object();

  static DatabaseBackupUploadDto? fromJson(dynamic value) {
    ApiCompat.upgrade<DatabaseBackupUploadDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(file: (json[r'file'] as MultipartFile?));
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (file != null) {
      json[r'file'] = file!;
    }
    return json;
  }

  DatabaseBackupUploadDto copyWith({Object? file = _undefined}) {
    return .new(file: identical(file, _undefined) ? this.file : file as MultipartFile?);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is DatabaseBackupUploadDto && file == other.file);
  }

  @override
  int get hashCode {
    return Object.hashAll([file]);
  }

  @override
  String toString() => 'DatabaseBackupUploadDto(file=$file)';
}
