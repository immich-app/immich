//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PluginTemplateResponseDto {
  /// Returns a new [PluginTemplateResponseDto] instance.
  PluginTemplateResponseDto({
    required this.description,
    required this.key,
    this.steps = const [],
    required this.title,
    required this.trigger,
    this.uiHints = const [],
  });

  /// Template description
  String description;

  /// Template key (unique across all templates)
  String key;

  /// Workflow steps
  List<PluginTemplateStepResponseDto> steps;

  /// Template title
  String title;

  WorkflowTrigger trigger;

  /// Ui hints, for example \"smart-album\"
  List<String> uiHints;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PluginTemplateResponseDto &&
    other.description == description &&
    other.key == key &&
    _deepEquality.equals(other.steps, steps) &&
    other.title == title &&
    other.trigger == trigger &&
    _deepEquality.equals(other.uiHints, uiHints);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (description.hashCode) +
    (key.hashCode) +
    (steps.hashCode) +
    (title.hashCode) +
    (trigger.hashCode) +
    (uiHints.hashCode);

  @override
  String toString() => 'PluginTemplateResponseDto[description=$description, key=$key, steps=$steps, title=$title, trigger=$trigger, uiHints=$uiHints]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'description'] = this.description;
      json[r'key'] = this.key;
      json[r'steps'] = this.steps;
      json[r'title'] = this.title;
      json[r'trigger'] = this.trigger;
      json[r'uiHints'] = this.uiHints;
    return json;
  }

  /// Returns a new [PluginTemplateResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PluginTemplateResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "PluginTemplateResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PluginTemplateResponseDto(
        description: mapValueOfType<String>(json, r'description')!,
        key: mapValueOfType<String>(json, r'key')!,
        steps: PluginTemplateStepResponseDto.listFromJson(json[r'steps']),
        title: mapValueOfType<String>(json, r'title')!,
        trigger: WorkflowTrigger.fromJson(json[r'trigger'])!,
        uiHints: json[r'uiHints'] is Iterable
            ? (json[r'uiHints'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<PluginTemplateResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PluginTemplateResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PluginTemplateResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PluginTemplateResponseDto> mapFromJson(dynamic json) {
    final map = <String, PluginTemplateResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PluginTemplateResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PluginTemplateResponseDto-objects as value to a dart map
  static Map<String, List<PluginTemplateResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PluginTemplateResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PluginTemplateResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'description',
    'key',
    'steps',
    'title',
    'trigger',
    'uiHints',
  };
}

