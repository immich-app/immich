//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DuplicateResolveResultDto {
  /// Returns a new [DuplicateResolveResultDto] instance.
  DuplicateResolveResultDto({
    required this.duplicateId,
    this.reason,
    required this.status,
  });

  /// The duplicate group ID that was processed
  String duplicateId;

  /// Error reason if status is FAILED
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? reason;

  /// Status of the resolve operation for this group
  DuplicateResolveResultDtoStatusEnum status;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DuplicateResolveResultDto &&
    other.duplicateId == duplicateId &&
    other.reason == reason &&
    other.status == status;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (duplicateId.hashCode) +
    (reason == null ? 0 : reason!.hashCode) +
    (status.hashCode);

  @override
  String toString() => 'DuplicateResolveResultDto[duplicateId=$duplicateId, reason=$reason, status=$status]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'duplicateId'] = this.duplicateId;
    if (this.reason != null) {
      json[r'reason'] = this.reason;
    } else {
    //  json[r'reason'] = null;
    }
      json[r'status'] = this.status;
    return json;
  }

  /// Returns a new [DuplicateResolveResultDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DuplicateResolveResultDto? fromJson(dynamic value) {
    upgradeDto(value, "DuplicateResolveResultDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DuplicateResolveResultDto(
        duplicateId: mapValueOfType<String>(json, r'duplicateId')!,
        reason: mapValueOfType<String>(json, r'reason'),
        status: DuplicateResolveResultDtoStatusEnum.fromJson(json[r'status'])!,
      );
    }
    return null;
  }

  static List<DuplicateResolveResultDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DuplicateResolveResultDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DuplicateResolveResultDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DuplicateResolveResultDto> mapFromJson(dynamic json) {
    final map = <String, DuplicateResolveResultDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DuplicateResolveResultDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DuplicateResolveResultDto-objects as value to a dart map
  static Map<String, List<DuplicateResolveResultDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DuplicateResolveResultDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DuplicateResolveResultDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'duplicateId',
    'status',
  };
}

/// Status of the resolve operation for this group
class DuplicateResolveResultDtoStatusEnum {
  /// Instantiate a new enum with the provided [value].
  const DuplicateResolveResultDtoStatusEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const SUCCESS = DuplicateResolveResultDtoStatusEnum._(r'SUCCESS');
  static const FAILED = DuplicateResolveResultDtoStatusEnum._(r'FAILED');

  /// List of all possible values in this [enum][DuplicateResolveResultDtoStatusEnum].
  static const values = <DuplicateResolveResultDtoStatusEnum>[
    SUCCESS,
    FAILED,
  ];

  static DuplicateResolveResultDtoStatusEnum? fromJson(dynamic value) => DuplicateResolveResultDtoStatusEnumTypeTransformer().decode(value);

  static List<DuplicateResolveResultDtoStatusEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DuplicateResolveResultDtoStatusEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DuplicateResolveResultDtoStatusEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [DuplicateResolveResultDtoStatusEnum] to String,
/// and [decode] dynamic data back to [DuplicateResolveResultDtoStatusEnum].
class DuplicateResolveResultDtoStatusEnumTypeTransformer {
  factory DuplicateResolveResultDtoStatusEnumTypeTransformer() => _instance ??= const DuplicateResolveResultDtoStatusEnumTypeTransformer._();

  const DuplicateResolveResultDtoStatusEnumTypeTransformer._();

  String encode(DuplicateResolveResultDtoStatusEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a DuplicateResolveResultDtoStatusEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  DuplicateResolveResultDtoStatusEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'SUCCESS': return DuplicateResolveResultDtoStatusEnum.SUCCESS;
        case r'FAILED': return DuplicateResolveResultDtoStatusEnum.FAILED;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [DuplicateResolveResultDtoStatusEnumTypeTransformer] instance.
  static DuplicateResolveResultDtoStatusEnumTypeTransformer? _instance;
}


