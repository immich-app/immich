// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class WorkflowShareResponseDto {
  const WorkflowShareResponseDto({
    required this.description,
    required this.name,
    required this.steps,
    required this.trigger,
  });

  /// Workflow description
  final String? description;

  /// Workflow name
  final String? name;

  /// Workflow steps
  final List<WorkflowShareStepDto> steps;

  /// Workflow trigger type
  final WorkflowTrigger trigger;

  static const _undefined = Object();

  static WorkflowShareResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<WorkflowShareResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      description: (json[r'description'] as String?),
      name: (json[r'name'] as String?),
      steps: ((json[r'steps'] as List?)?.map(($e) => (WorkflowShareStepDto.fromJson($e))!).toList(growable: false))!,
      trigger: (WorkflowTrigger.fromJson(json[r'trigger']))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (description != null) {
      json[r'description'] = description!;
    }
    if (name != null) {
      json[r'name'] = name!;
    }
    json[r'steps'] = steps.map(($e) => $e.toJson()).toList(growable: false);
    json[r'trigger'] = trigger.toJson();
    return json;
  }

  WorkflowShareResponseDto copyWith({
    Object? description = _undefined,
    Object? name = _undefined,
    List<WorkflowShareStepDto>? steps,
    WorkflowTrigger? trigger,
  }) {
    return .new(
      description: identical(description, _undefined) ? this.description : description as String?,
      name: identical(name, _undefined) ? this.name : name as String?,
      steps: steps ?? this.steps,
      trigger: trigger ?? this.trigger,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is WorkflowShareResponseDto &&
            description == other.description &&
            name == other.name &&
            const DeepCollectionEquality().equals(steps, other.steps) &&
            trigger == other.trigger);
  }

  @override
  int get hashCode {
    return Object.hashAll([description, name, const DeepCollectionEquality().hash(steps), trigger]);
  }

  @override
  String toString() => 'WorkflowShareResponseDto(description=$description, name=$name, steps=$steps, trigger=$trigger)';
}
