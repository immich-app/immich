// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class WorkflowTriggerResponseDto {
  const WorkflowTriggerResponseDto({required this.trigger, required this.types});

  /// Trigger type
  final WorkflowTrigger trigger;

  /// Workflow types
  final List<WorkflowType> types;

  static WorkflowTriggerResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<WorkflowTriggerResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      trigger: (WorkflowTrigger.fromJson(json[r'trigger']))!,
      types: ((json[r'types'] as List?)?.map(($e) => (WorkflowType.fromJson($e))!).toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'trigger'] = trigger.toJson();
    json[r'types'] = types.map(($e) => $e.toJson()).toList(growable: false);
    return json;
  }

  WorkflowTriggerResponseDto copyWith({WorkflowTrigger? trigger, List<WorkflowType>? types}) {
    return .new(trigger: trigger ?? this.trigger, types: types ?? this.types);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is WorkflowTriggerResponseDto &&
            trigger == other.trigger &&
            const DeepCollectionEquality().equals(types, other.types));
  }

  @override
  int get hashCode {
    return Object.hashAll([trigger, const DeepCollectionEquality().hash(types)]);
  }

  @override
  String toString() => 'WorkflowTriggerResponseDto(trigger=$trigger, types=$types)';
}
