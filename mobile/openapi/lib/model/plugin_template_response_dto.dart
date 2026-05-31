// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class PluginTemplateResponseDto {
  const PluginTemplateResponseDto({
    required this.description,
    required this.key,
    required this.steps,
    required this.title,
    required this.trigger,
    required this.uiHints,
  });

  /// Template description
  final String description;

  /// Template key (unique across all templates)
  final String key;

  /// Workflow steps
  final List<PluginTemplateStepResponseDto> steps;

  /// Template title
  final String title;

  /// Workflow trigger
  final WorkflowTrigger trigger;

  /// Ui hints, for example "smart-album"
  final List<String> uiHints;

  static PluginTemplateResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<PluginTemplateResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      description: json[r'description'] as String,
      key: json[r'key'] as String,
      steps: ((json[r'steps'] as List?)
          ?.map(($e) => (PluginTemplateStepResponseDto.fromJson($e))!)
          .toList(growable: false))!,
      title: json[r'title'] as String,
      trigger: (WorkflowTrigger.fromJson(json[r'trigger']))!,
      uiHints: ((json[r'uiHints'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'description'] = description;
    json[r'key'] = key;
    json[r'steps'] = steps.map(($e) => $e.toJson()).toList(growable: false);
    json[r'title'] = title;
    json[r'trigger'] = trigger.toJson();
    json[r'uiHints'] = uiHints;
    return json;
  }

  PluginTemplateResponseDto copyWith({
    String? description,
    String? key,
    List<PluginTemplateStepResponseDto>? steps,
    String? title,
    WorkflowTrigger? trigger,
    List<String>? uiHints,
  }) {
    return .new(
      description: description ?? this.description,
      key: key ?? this.key,
      steps: steps ?? this.steps,
      title: title ?? this.title,
      trigger: trigger ?? this.trigger,
      uiHints: uiHints ?? this.uiHints,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is PluginTemplateResponseDto &&
            description == other.description &&
            key == other.key &&
            const DeepCollectionEquality().equals(steps, other.steps) &&
            title == other.title &&
            trigger == other.trigger &&
            const DeepCollectionEquality().equals(uiHints, other.uiHints));
  }

  @override
  int get hashCode {
    return Object.hashAll([
      description,
      key,
      const DeepCollectionEquality().hash(steps),
      title,
      trigger,
      const DeepCollectionEquality().hash(uiHints),
    ]);
  }

  @override
  String toString() =>
      'PluginTemplateResponseDto(description=$description, key=$key, steps=$steps, title=$title, trigger=$trigger, uiHints=$uiHints)';
}
