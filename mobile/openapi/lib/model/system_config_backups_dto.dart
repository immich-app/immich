// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigBackupsDto {
  const SystemConfigBackupsDto({required this.database});

  final DatabaseBackupConfig database;

  static SystemConfigBackupsDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigBackupsDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(database: (DatabaseBackupConfig.fromJson(json[r'database']))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'database'] = database.toJson();
    return json;
  }

  SystemConfigBackupsDto copyWith({DatabaseBackupConfig? database}) {
    return .new(database: database ?? this.database);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SystemConfigBackupsDto && database == other.database);
  }

  @override
  int get hashCode {
    return Object.hashAll([database]);
  }

  @override
  String toString() => 'SystemConfigBackupsDto(database=$database)';
}
