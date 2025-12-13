//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class BulkIdResponseDto {
  /// Returns a new [BulkIdResponseDto] instance.
  BulkIdResponseDto({
    this.error,
    required this.id,
    required this.success,
  });

  BulkIdResponseDtoErrorEnum? error;

  String id;

  bool success;

  @override
  bool operator ==(Object other) => identical(this, other) || other is BulkIdResponseDto &&
    other.error == error &&
    other.id == id &&
    other.success == success;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (error == null ? 0 : error!.hashCode) +
    (id.hashCode) +
    (success.hashCode);

  @override
  String toString() => 'BulkIdResponseDto[error=$error, id=$id, success=$success]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.error != null) {
      json[r'error'] = this.error;
    } else {
    //  json[r'error'] = null;
    }
      json[r'id'] = this.id;
      json[r'success'] = this.success;
    return json;
  }

  /// Returns a new [BulkIdResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static BulkIdResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "BulkIdResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return BulkIdResponseDto(
        error: BulkIdResponseDtoErrorEnum.fromJson(json[r'error']),
        id: mapValueOfType<String>(json, r'id')!,
        success: mapValueOfType<bool>(json, r'success')!,
      );
    }
    return null;
  }

  static List<BulkIdResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <BulkIdResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = BulkIdResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, BulkIdResponseDto> mapFromJson(dynamic json) {
    final map = <String, BulkIdResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = BulkIdResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of BulkIdResponseDto-objects as value to a dart map
  static Map<String, List<BulkIdResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<BulkIdResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = BulkIdResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'success',
  };
}


class BulkIdResponseDtoErrorEnum {
  /// Instantiate a new enum with the provided [value].
  const BulkIdResponseDtoErrorEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const duplicate = BulkIdResponseDtoErrorEnum._(r'duplicate');
  static const noPermission = BulkIdResponseDtoErrorEnum._(r'no_permission');
  static const notFound = BulkIdResponseDtoErrorEnum._(r'not_found');
  static const unknown = BulkIdResponseDtoErrorEnum._(r'unknown');

  /// List of all possible values in this [enum][BulkIdResponseDtoErrorEnum].
  static const values = <BulkIdResponseDtoErrorEnum>[
    duplicate,
    noPermission,
    notFound,
    unknown,
  ];

  static BulkIdResponseDtoErrorEnum? fromJson(dynamic value) => BulkIdResponseDtoErrorEnumTypeTransformer().decode(value);

  static List<BulkIdResponseDtoErrorEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <BulkIdResponseDtoErrorEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = BulkIdResponseDtoErrorEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [BulkIdResponseDtoErrorEnum] to String,
/// and [decode] dynamic data back to [BulkIdResponseDtoErrorEnum].
class BulkIdResponseDtoErrorEnumTypeTransformer {
  factory BulkIdResponseDtoErrorEnumTypeTransformer() => _instance ??= const BulkIdResponseDtoErrorEnumTypeTransformer._();

  const BulkIdResponseDtoErrorEnumTypeTransformer._();

  String encode(BulkIdResponseDtoErrorEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a BulkIdResponseDtoErrorEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  BulkIdResponseDtoErrorEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'duplicate': return BulkIdResponseDtoErrorEnum.duplicate;
        case r'no_permission': return BulkIdResponseDtoErrorEnum.noPermission;
        case r'not_found': return BulkIdResponseDtoErrorEnum.notFound;
        case r'unknown': return BulkIdResponseDtoErrorEnum.unknown;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [BulkIdResponseDtoErrorEnumTypeTransformer] instance.
  static BulkIdResponseDtoErrorEnumTypeTransformer? _instance;
}


