// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class WorkflowUpdateDto {
  const WorkflowUpdateDto({
    this.description = const Optional.absent(),
    this.enabled = const Optional.absent(),
    this.name = const Optional.absent(),
    this.steps = const Optional.absent(),
    this.trigger = const Optional.absent(),
  });

  /// Workflow description
  final Optional<String?> description;

  /// Workflow enabled
  final Optional<bool> enabled;

  /// Workflow name
  final Optional<String?> name;

  final Optional<List<WorkflowStepDto>> steps;

  /// Workflow trigger type
  final Optional<WorkflowTrigger> trigger;

  static WorkflowUpdateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<WorkflowUpdateDto>(value);
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
      trigger: json.containsKey(r'trigger')
          ? Optional.present((WorkflowTrigger.fromJson(json[r'trigger']))!)
          : const Optional.absent(),
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
    if (trigger case Present(:final value)) {
      json[r'trigger'] = value.toJson();
    }
    return json;
  }

  WorkflowUpdateDto copyWith({
    Optional<String?>? description,
    Optional<bool>? enabled,
    Optional<String?>? name,
    Optional<List<WorkflowStepDto>>? steps,
    Optional<WorkflowTrigger>? trigger,
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
        (other is WorkflowUpdateDto &&
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
      'WorkflowUpdateDto(description=$description, enabled=$enabled, name=$name, steps=$steps, trigger=$trigger)';
}
