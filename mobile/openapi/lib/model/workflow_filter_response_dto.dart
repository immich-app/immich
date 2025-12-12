//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class WorkflowFilterResponseDto {
  /// Returns a new [WorkflowFilterResponseDto] instance.
  WorkflowFilterResponseDto({
    required this.filterConfig,
    required this.id,
    required this.order,
    required this.pluginFilterId,
    required this.workflowId,
  });

  Object? filterConfig;

  String id;

  num order;

  String pluginFilterId;

  String workflowId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is WorkflowFilterResponseDto &&
    other.filterConfig == filterConfig &&
    other.id == id &&
    other.order == order &&
    other.pluginFilterId == pluginFilterId &&
    other.workflowId == workflowId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (filterConfig == null ? 0 : filterConfig!.hashCode) +
    (id.hashCode) +
    (order.hashCode) +
    (pluginFilterId.hashCode) +
    (workflowId.hashCode);

  @override
  String toString() => 'WorkflowFilterResponseDto[filterConfig=$filterConfig, id=$id, order=$order, pluginFilterId=$pluginFilterId, workflowId=$workflowId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.filterConfig != null) {
      json[r'filterConfig'] = this.filterConfig;
    } else {
    //  json[r'filterConfig'] = null;
    }
      json[r'id'] = this.id;
      json[r'order'] = this.order;
      json[r'pluginFilterId'] = this.pluginFilterId;
      json[r'workflowId'] = this.workflowId;
    return json;
  }

  /// Returns a new [WorkflowFilterResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static WorkflowFilterResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "WorkflowFilterResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return WorkflowFilterResponseDto(
        filterConfig: mapValueOfType<Object>(json, r'filterConfig'),
        id: mapValueOfType<String>(json, r'id')!,
        order: num.parse('${json[r'order']}'),
        pluginFilterId: mapValueOfType<String>(json, r'pluginFilterId')!,
        workflowId: mapValueOfType<String>(json, r'workflowId')!,
      );
    }
    return null;
  }

  static List<WorkflowFilterResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WorkflowFilterResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WorkflowFilterResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, WorkflowFilterResponseDto> mapFromJson(dynamic json) {
    final map = <String, WorkflowFilterResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = WorkflowFilterResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of WorkflowFilterResponseDto-objects as value to a dart map
  static Map<String, List<WorkflowFilterResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<WorkflowFilterResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = WorkflowFilterResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'filterConfig',
    'id',
    'order',
    'pluginFilterId',
    'workflowId',
  };
}

