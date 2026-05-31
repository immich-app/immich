// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SetMaintenanceModeDto {
  const SetMaintenanceModeDto({required this.action, this.restoreBackupFilename = const Optional.absent()});

  final MaintenanceAction action;

  /// Restore backup filename
  final Optional<String> restoreBackupFilename;

  static SetMaintenanceModeDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SetMaintenanceModeDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      action: (MaintenanceAction.fromJson(json[r'action']))!,
      restoreBackupFilename: json.containsKey(r'restoreBackupFilename')
          ? Optional.present(json[r'restoreBackupFilename'] as String)
          : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'action'] = action.toJson();
    if (restoreBackupFilename case Present(:final value)) {
      json[r'restoreBackupFilename'] = value;
    }
    return json;
  }

  SetMaintenanceModeDto copyWith({MaintenanceAction? action, Optional<String>? restoreBackupFilename}) {
    return .new(
      action: action ?? this.action,
      restoreBackupFilename: restoreBackupFilename ?? this.restoreBackupFilename,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SetMaintenanceModeDto &&
            action == other.action &&
            restoreBackupFilename == other.restoreBackupFilename);
  }

  @override
  int get hashCode {
    return Object.hashAll([action, restoreBackupFilename]);
  }

  @override
  String toString() => 'SetMaintenanceModeDto(action=$action, restoreBackupFilename=$restoreBackupFilename)';
}
