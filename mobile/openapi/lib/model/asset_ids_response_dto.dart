//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetIdsResponseDto {
  /// Returns a new [AssetIdsResponseDto] instance.
  AssetIdsResponseDto({
    required this.assetId,
    this.error,
    required this.success,
  });

  String assetId;

  AssetIdsResponseDtoErrorEnum? error;

  bool success;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetIdsResponseDto &&
    other.assetId == assetId &&
    other.error == error &&
    other.success == success;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetId.hashCode) +
    (error == null ? 0 : error!.hashCode) +
    (success.hashCode);

  @override
  String toString() => 'AssetIdsResponseDto[assetId=$assetId, error=$error, success=$success]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetId'] = this.assetId;
    if (this.error != null) {
      json[r'error'] = this.error;
    } else {
    //  json[r'error'] = null;
    }
      json[r'success'] = this.success;
    return json;
  }

  /// Returns a new [AssetIdsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetIdsResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetIdsResponseDto(
        assetId: mapValueOfType<String>(json, r'assetId')!,
        error: AssetIdsResponseDtoErrorEnum.fromJson(json[r'error']),
        success: mapValueOfType<bool>(json, r'success')!,
      );
    }
    return null;
  }

  static List<AssetIdsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetIdsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetIdsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetIdsResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetIdsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetIdsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetIdsResponseDto-objects as value to a dart map
  static Map<String, List<AssetIdsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetIdsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetIdsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetId',
    'success',
  };
}


class AssetIdsResponseDtoErrorEnum {
  /// Instantiate a new enum with the provided [value].
  const AssetIdsResponseDtoErrorEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const duplicate = AssetIdsResponseDtoErrorEnum._(r'duplicate');
  static const noPermission = AssetIdsResponseDtoErrorEnum._(r'no_permission');
  static const notFound = AssetIdsResponseDtoErrorEnum._(r'not_found');

  /// List of all possible values in this [enum][AssetIdsResponseDtoErrorEnum].
  static const values = <AssetIdsResponseDtoErrorEnum>[
    duplicate,
    noPermission,
    notFound,
  ];

  static AssetIdsResponseDtoErrorEnum? fromJson(dynamic value) => AssetIdsResponseDtoErrorEnumTypeTransformer().decode(value);

  static List<AssetIdsResponseDtoErrorEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetIdsResponseDtoErrorEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetIdsResponseDtoErrorEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetIdsResponseDtoErrorEnum] to String,
/// and [decode] dynamic data back to [AssetIdsResponseDtoErrorEnum].
class AssetIdsResponseDtoErrorEnumTypeTransformer {
  factory AssetIdsResponseDtoErrorEnumTypeTransformer() => _instance ??= const AssetIdsResponseDtoErrorEnumTypeTransformer._();

  const AssetIdsResponseDtoErrorEnumTypeTransformer._();

  String encode(AssetIdsResponseDtoErrorEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetIdsResponseDtoErrorEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetIdsResponseDtoErrorEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'duplicate': return AssetIdsResponseDtoErrorEnum.duplicate;
        case r'no_permission': return AssetIdsResponseDtoErrorEnum.noPermission;
        case r'not_found': return AssetIdsResponseDtoErrorEnum.notFound;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetIdsResponseDtoErrorEnumTypeTransformer] instance.
  static AssetIdsResponseDtoErrorEnumTypeTransformer? _instance;
}


