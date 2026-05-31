// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class WorkflowCreateDto {
  const WorkflowCreateDto({
    this.description = const Optional.absent(),
    this.enabled = const Optional.absent(),
    this.name = const Optional.absent(),
    this.steps = const Optional.absent(),
    required this.trigger,
  });

  /// Workflow description
  final Optional<String?> description;

  /// Workflow enabled
  final Optional<bool> enabled;

  /// Workflow name
  final Optional<String?> name;

  final Optional<List<WorkflowStepDto>> steps;

  /// Workflow trigger type
  final WorkflowTrigger trigger;

  static WorkflowCreateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<WorkflowCreateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      description: json.containsKey(r'description')
          ? Optional.present((json[r'description'] as String?))
          : const Optional.absent(),
      enabled: json.containsKey(r'enabled') ? Optional.present(json[r'enabled'] as bool) : const Optional.absent(),
      name: json.containsKey(r'name') ? Optional.present((json[r'name'] as String?)) : const Optional.absent(),
      steps: json.containsKey(r'steps')
          ? Optional.present(
              ((json[r'steps'] as List?)?.map(($e) => (WorkflowStepDto.fromJson($e))!).toList(growable: false))!,
            )
          : const Optional.absent(),
      trigger: (WorkflowTrigger.fromJson(json[r'trigger']))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (description case Present(:final value)) {
      json[r'description'] = value;
    }
    if (enabled case Present(:final value)) {
      json[r'enabled'] = value;
    }
    if (name case Present(:final value)) {
      json[r'name'] = value;
    }
    if (steps case Present(:final value)) {
      json[r'steps'] = value.map(($e) => $e.toJson()).toList(growable: false);
    }
    json[r'trigger'] = trigger.toJson();
    return json;
  }

  WorkflowCreateDto copyWith({
    Optional<String?>? description,
    Optional<bool>? enabled,
    Optional<String?>? name,
    Optional<List<WorkflowStepDto>>? steps,
    WorkflowTrigger? trigger,
  }) {
    return .new(
      description: description ?? this.description,
      enabled: enabled ?? this.enabled,
      name: name ?? this.name,
      steps: steps ?? this.steps,
      trigger: trigger ?? this.trigger,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is WorkflowCreateDto &&
            description == other.description &&
            enabled == other.enabled &&
            name == other.name &&
            steps == other.steps &&
            trigger == other.trigger);
  }

  @override
  int get hashCode {
    return Object.hashAll([description, enabled, name, steps, trigger]);
  }

  @override
  String toString() =>
      'WorkflowCreateDto(description=$description, enabled=$enabled, name=$name, steps=$steps, trigger=$trigger)';
}
