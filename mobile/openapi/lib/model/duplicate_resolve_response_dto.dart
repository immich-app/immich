//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DuplicateResolveResponseDto {
  /// Returns a new [DuplicateResolveResponseDto] instance.
  DuplicateResolveResponseDto({
    this.results = const [],
    required this.status,
  });

  /// Per-group results of the resolve operation
  List<DuplicateResolveResultDto> results;

  /// Overall status of the resolve operation
  DuplicateResolveResponseDtoStatusEnum status;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DuplicateResolveResponseDto &&
    _deepEquality.equals(other.results, results) &&
    other.status == status;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (results.hashCode) +
    (status.hashCode);

  @override
  String toString() => 'DuplicateResolveResponseDto[results=$results, status=$status]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'results'] = this.results;
      json[r'status'] = this.status;
    return json;
  }

  /// Returns a new [DuplicateResolveResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DuplicateResolveResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "DuplicateResolveResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DuplicateResolveResponseDto(
        results: DuplicateResolveResultDto.listFromJson(json[r'results']),
        status: DuplicateResolveResponseDtoStatusEnum.fromJson(json[r'status'])!,
      );
    }
    return null;
  }

  static List<DuplicateResolveResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DuplicateResolveResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DuplicateResolveResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DuplicateResolveResponseDto> mapFromJson(dynamic json) {
    final map = <String, DuplicateResolveResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DuplicateResolveResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DuplicateResolveResponseDto-objects as value to a dart map
  static Map<String, List<DuplicateResolveResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DuplicateResolveResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DuplicateResolveResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'results',
    'status',
  };
}

/// Overall status of the resolve operation
class DuplicateResolveResponseDtoStatusEnum {
  /// Instantiate a new enum with the provided [value].
  const DuplicateResolveResponseDtoStatusEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const COMPLETED = DuplicateResolveResponseDtoStatusEnum._(r'COMPLETED');

  /// List of all possible values in this [enum][DuplicateResolveResponseDtoStatusEnum].
  static const values = <DuplicateResolveResponseDtoStatusEnum>[
    COMPLETED,
  ];

  static DuplicateResolveResponseDtoStatusEnum? fromJson(dynamic value) => DuplicateResolveResponseDtoStatusEnumTypeTransformer().decode(value);

  static List<DuplicateResolveResponseDtoStatusEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DuplicateResolveResponseDtoStatusEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DuplicateResolveResponseDtoStatusEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [DuplicateResolveResponseDtoStatusEnum] to String,
/// and [decode] dynamic data back to [DuplicateResolveResponseDtoStatusEnum].
class DuplicateResolveResponseDtoStatusEnumTypeTransformer {
  factory DuplicateResolveResponseDtoStatusEnumTypeTransformer() => _instance ??= const DuplicateResolveResponseDtoStatusEnumTypeTransformer._();

  const DuplicateResolveResponseDtoStatusEnumTypeTransformer._();

  String encode(DuplicateResolveResponseDtoStatusEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a DuplicateResolveResponseDtoStatusEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  DuplicateResolveResponseDtoStatusEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'COMPLETED': return DuplicateResolveResponseDtoStatusEnum.COMPLETED;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [DuplicateResolveResponseDtoStatusEnumTypeTransformer] instance.
  static DuplicateResolveResponseDtoStatusEnumTypeTransformer? _instance;
}


