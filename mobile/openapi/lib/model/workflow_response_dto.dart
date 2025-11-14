//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class WorkflowResponseDto {
  /// Returns a new [WorkflowResponseDto] instance.
  WorkflowResponseDto({
    this.actions = const [],
    required this.createdAt,
    required this.description,
    required this.enabled,
    this.filters = const [],
    required this.id,
    required this.name,
    required this.ownerId,
    required this.triggerType,
  });

  List<WorkflowActionResponseDto> actions;

  String createdAt;

  String description;

  bool enabled;

  List<WorkflowFilterResponseDto> filters;

  String id;

  String? name;

  String ownerId;

  WorkflowResponseDtoTriggerTypeEnum triggerType;

  @override
  bool operator ==(Object other) => identical(this, other) || other is WorkflowResponseDto &&
    _deepEquality.equals(other.actions, actions) &&
    other.createdAt == createdAt &&
    other.description == description &&
    other.enabled == enabled &&
    _deepEquality.equals(other.filters, filters) &&
    other.id == id &&
    other.name == name &&
    other.ownerId == ownerId &&
    other.triggerType == triggerType;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (actions.hashCode) +
    (createdAt.hashCode) +
    (description.hashCode) +
    (enabled.hashCode) +
    (filters.hashCode) +
    (id.hashCode) +
    (name == null ? 0 : name!.hashCode) +
    (ownerId.hashCode) +
    (triggerType.hashCode);

  @override
  String toString() => 'WorkflowResponseDto[actions=$actions, createdAt=$createdAt, description=$description, enabled=$enabled, filters=$filters, id=$id, name=$name, ownerId=$ownerId, triggerType=$triggerType]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'actions'] = this.actions;
      json[r'createdAt'] = this.createdAt;
      json[r'description'] = this.description;
      json[r'enabled'] = this.enabled;
      json[r'filters'] = this.filters;
      json[r'id'] = this.id;
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
    //  json[r'name'] = null;
    }
      json[r'ownerId'] = this.ownerId;
      json[r'triggerType'] = this.triggerType;
    return json;
  }

  /// Returns a new [WorkflowResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static WorkflowResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "WorkflowResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return WorkflowResponseDto(
        actions: WorkflowActionResponseDto.listFromJson(json[r'actions']),
        createdAt: mapValueOfType<String>(json, r'createdAt')!,
        description: mapValueOfType<String>(json, r'description')!,
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        filters: WorkflowFilterResponseDto.listFromJson(json[r'filters']),
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name'),
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        triggerType: WorkflowResponseDtoTriggerTypeEnum.fromJson(json[r'triggerType'])!,
      );
    }
    return null;
  }

  static List<WorkflowResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WorkflowResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WorkflowResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, WorkflowResponseDto> mapFromJson(dynamic json) {
    final map = <String, WorkflowResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = WorkflowResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of WorkflowResponseDto-objects as value to a dart map
  static Map<String, List<WorkflowResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<WorkflowResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = WorkflowResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'actions',
    'createdAt',
    'description',
    'enabled',
    'filters',
    'id',
    'name',
    'ownerId',
    'triggerType',
  };
}


class WorkflowResponseDtoTriggerTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const WorkflowResponseDtoTriggerTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const assetCreate = WorkflowResponseDtoTriggerTypeEnum._(r'AssetCreate');
  static const personRecognized = WorkflowResponseDtoTriggerTypeEnum._(r'PersonRecognized');

  /// List of all possible values in this [enum][WorkflowResponseDtoTriggerTypeEnum].
  static const values = <WorkflowResponseDtoTriggerTypeEnum>[
    assetCreate,
    personRecognized,
  ];

  static WorkflowResponseDtoTriggerTypeEnum? fromJson(dynamic value) => WorkflowResponseDtoTriggerTypeEnumTypeTransformer().decode(value);

  static List<WorkflowResponseDtoTriggerTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WorkflowResponseDtoTriggerTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WorkflowResponseDtoTriggerTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [WorkflowResponseDtoTriggerTypeEnum] to String,
/// and [decode] dynamic data back to [WorkflowResponseDtoTriggerTypeEnum].
class WorkflowResponseDtoTriggerTypeEnumTypeTransformer {
  factory WorkflowResponseDtoTriggerTypeEnumTypeTransformer() => _instance ??= const WorkflowResponseDtoTriggerTypeEnumTypeTransformer._();

  const WorkflowResponseDtoTriggerTypeEnumTypeTransformer._();

  String encode(WorkflowResponseDtoTriggerTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a WorkflowResponseDtoTriggerTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  WorkflowResponseDtoTriggerTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'AssetCreate': return WorkflowResponseDtoTriggerTypeEnum.assetCreate;
        case r'PersonRecognized': return WorkflowResponseDtoTriggerTypeEnum.personRecognized;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [WorkflowResponseDtoTriggerTypeEnumTypeTransformer] instance.
  static WorkflowResponseDtoTriggerTypeEnumTypeTransformer? _instance;
}


