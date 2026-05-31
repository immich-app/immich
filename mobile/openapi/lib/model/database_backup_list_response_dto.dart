// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class DatabaseBackupListResponseDto {
  const DatabaseBackupListResponseDto({required this.backups});

  /// List of backups
  final List<DatabaseBackupDto> backups;

  static DatabaseBackupListResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<DatabaseBackupListResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      backups: ((json[r'backups'] as List?)?.map(($e) => (DatabaseBackupDto.fromJson($e))!).toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'backups'] = backups.map(($e) => $e.toJson()).toList(growable: false);
    return json;
  }

  DatabaseBackupListResponseDto copyWith({List<DatabaseBackupDto>? backups}) {
    return .new(backups: backups ?? this.backups);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is DatabaseBackupListResponseDto && const DeepCollectionEquality().equals(backups, other.backups));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(backups)]);
  }

  @override
  String toString() => 'DatabaseBackupListResponseDto(backups=$backups)';
}
