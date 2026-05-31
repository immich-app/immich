// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class DatabaseBackupDto {
  const DatabaseBackupDto({required this.filename, required this.filesize, required this.timezone});

  /// Backup filename
  final String filename;

  /// Backup file size
  final int filesize;

  /// Backup timezone
  final String timezone;

  static DatabaseBackupDto? fromJson(dynamic value) {
    ApiCompat.upgrade<DatabaseBackupDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      filename: json[r'filename'] as String,
      filesize: json[r'filesize'] as int,
      timezone: json[r'timezone'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'filename'] = filename;
    json[r'filesize'] = filesize;
    json[r'timezone'] = timezone;
    return json;
  }

  DatabaseBackupDto copyWith({String? filename, int? filesize, String? timezone}) {
    return .new(
      filename: filename ?? this.filename,
      filesize: filesize ?? this.filesize,
      timezone: timezone ?? this.timezone,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is DatabaseBackupDto &&
            filename == other.filename &&
            filesize == other.filesize &&
            timezone == other.timezone);
  }

  @override
  int get hashCode {
    return Object.hashAll([filename, filesize, timezone]);
  }

  @override
  String toString() => 'DatabaseBackupDto(filename=$filename, filesize=$filesize, timezone=$timezone)';
}
