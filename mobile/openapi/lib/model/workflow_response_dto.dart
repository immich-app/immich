// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class WorkflowResponseDto {
  const WorkflowResponseDto({
    required this.createdAt,
    required this.description,
    required this.enabled,
    required this.id,
    required this.name,
    required this.steps,
    required this.trigger,
    required this.updatedAt,
  });

  /// Creation date
  final String createdAt;

  /// Workflow description
  final String? description;

  /// Workflow enabled
  final bool enabled;

  /// Workflow ID
  final String id;

  /// Workflow name
  final String? name;

  /// Workflow steps
  final List<WorkflowStepDto> steps;

  /// Workflow trigger type
  final WorkflowTrigger trigger;

  /// Update date
  final String updatedAt;

  static const _undefined = Object();

  static WorkflowResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<WorkflowResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      createdAt: json[r'createdAt'] as String,
      description: (json[r'description'] as String?),
      enabled: json[r'enabled'] as bool,
      id: json[r'id'] as String,
      name: (json[r'name'] as String?),
      steps: ((json[r'steps'] as List?)?.map(($e) => (WorkflowStepDto.fromJson($e))!).toList(growable: false))!,
      trigger: (WorkflowTrigger.fromJson(json[r'trigger']))!,
      updatedAt: json[r'updatedAt'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'createdAt'] = createdAt;
    if (description != null) {
      json[r'description'] = description!;
    }
    json[r'enabled'] = enabled;
    json[r'id'] = id;
    if (name != null) {
      json[r'name'] = name!;
    }
    json[r'steps'] = steps.map(($e) => $e.toJson()).toList(growable: false);
    json[r'trigger'] = trigger.toJson();
    json[r'updatedAt'] = updatedAt;
    return json;
  }

  WorkflowResponseDto copyWith({
    String? createdAt,
    Object? description = _undefined,
    bool? enabled,
    String? id,
    Object? name = _undefined,
    List<WorkflowStepDto>? steps,
    WorkflowTrigger? trigger,
    String? updatedAt,
  }) {
    return .new(
      createdAt: createdAt ?? this.createdAt,
      description: identical(description, _undefined) ? this.description : description as String?,
      enabled: enabled ?? this.enabled,
      id: id ?? this.id,
      name: identical(name, _undefined) ? this.name : name as String?,
      steps: steps ?? this.steps,
      trigger: trigger ?? this.trigger,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is WorkflowResponseDto &&
            createdAt == other.createdAt &&
            description == other.description &&
            enabled == other.enabled &&
            id == other.id &&
            name == other.name &&
            const DeepCollectionEquality().equals(steps, other.steps) &&
            trigger == other.trigger &&
            updatedAt == other.updatedAt);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      createdAt,
      description,
      enabled,
      id,
      name,
      const DeepCollectionEquality().hash(steps),
      trigger,
      updatedAt,
    ]);
  }

  @override
  String toString() =>
      'WorkflowResponseDto(createdAt=$createdAt, description=$description, enabled=$enabled, id=$id, name=$name, steps=$steps, trigger=$trigger, updatedAt=$updatedAt)';
}
