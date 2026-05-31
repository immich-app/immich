// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class MaintenanceStatusResponseDto {
  const MaintenanceStatusResponseDto({
    required this.action,
    required this.active,
    this.error,
    this.progress,
    this.task,
  });

  final MaintenanceAction action;

  final bool active;

  final String? error;

  final int? progress;

  final String? task;

  static const _undefined = Object();

  static MaintenanceStatusResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<MaintenanceStatusResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      action: (MaintenanceAction.fromJson(json[r'action']))!,
      active: json[r'active'] as bool,
      error: (json[r'error'] as String?),
      progress: (json[r'progress'] as int?),
      task: (json[r'task'] as String?),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'action'] = action.toJson();
    json[r'active'] = active;
    if (error != null) {
      json[r'error'] = error!;
    }
    if (progress != null) {
      json[r'progress'] = progress!;
    }
    if (task != null) {
      json[r'task'] = task!;
    }
    return json;
  }

  MaintenanceStatusResponseDto copyWith({
    MaintenanceAction? action,
    bool? active,
    Object? error = _undefined,
    Object? progress = _undefined,
    Object? task = _undefined,
  }) {
    return .new(
      action: action ?? this.action,
      active: active ?? this.active,
      error: identical(error, _undefined) ? this.error : error as String?,
      progress: identical(progress, _undefined) ? this.progress : progress as int?,
      task: identical(task, _undefined) ? this.task : task as String?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is MaintenanceStatusResponseDto &&
            action == other.action &&
            active == other.active &&
            error == other.error &&
            progress == other.progress &&
            task == other.task);
  }

  @override
  int get hashCode {
    return Object.hashAll([action, active, error, progress, task]);
  }

  @override
  String toString() =>
      'MaintenanceStatusResponseDto(action=$action, active=$active, error=$error, progress=$progress, task=$task)';
}
