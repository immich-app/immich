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
    required this.filterId,
    required this.id,
    required this.order,
    required this.workflowId,
  });

  Object? filterConfig;

  String filterId;

  String id;

  num order;

  String workflowId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is WorkflowFilterResponseDto &&
    other.filterConfig == filterConfig &&
    other.filterId == filterId &&
    other.id == id &&
    other.order == order &&
    other.workflowId == workflowId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (filterConfig == null ? 0 : filterConfig!.hashCode) +
    (filterId.hashCode) +
    (id.hashCode) +
    (order.hashCode) +
    (workflowId.hashCode);

  @override
  String toString() => 'WorkflowFilterResponseDto[filterConfig=$filterConfig, filterId=$filterId, id=$id, order=$order, workflowId=$workflowId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.filterConfig != null) {
      json[r'filterConfig'] = this.filterConfig;
    } else {
    //  json[r'filterConfig'] = null;
    }
      json[r'filterId'] = this.filterId;
      json[r'id'] = this.id;
      json[r'order'] = this.order;
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
        filterId: mapValueOfType<String>(json, r'filterId')!,
        id: mapValueOfType<String>(json, r'id')!,
        order: num.parse('${json[r'order']}'),
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
    'filterId',
    'id',
    'order',
    'workflowId',
  };
}

