// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class DatabaseBackupDeleteDto {
  const DatabaseBackupDeleteDto({required this.backups});

  /// Backup filenames to delete
  final List<String> backups;

  static DatabaseBackupDeleteDto? fromJson(dynamic value) {
    ApiCompat.upgrade<DatabaseBackupDeleteDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(backups: ((json[r'backups'] as List?)?.map(($e) => $e as String).toList(growable: false))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'backups'] = backups;
    return json;
  }

  DatabaseBackupDeleteDto copyWith({List<String>? backups}) {
    return .new(backups: backups ?? this.backups);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is DatabaseBackupDeleteDto && const DeepCollectionEquality().equals(backups, other.backups));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(backups)]);
  }

  @override
  String toString() => 'DatabaseBackupDeleteDto(backups=$backups)';
}
