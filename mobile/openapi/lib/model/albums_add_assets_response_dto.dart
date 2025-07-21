//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AlbumsAddAssetsResponseDto {
  /// Returns a new [AlbumsAddAssetsResponseDto] instance.
  AlbumsAddAssetsResponseDto({
    required this.albumSuccessCount,
    required this.assetSuccessCount,
    this.error,
    required this.success,
  });

  int albumSuccessCount;

  int assetSuccessCount;

  AlbumsAddAssetsResponseDtoErrorEnum? error;

  bool success;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumsAddAssetsResponseDto &&
    other.albumSuccessCount == albumSuccessCount &&
    other.assetSuccessCount == assetSuccessCount &&
    other.error == error &&
    other.success == success;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumSuccessCount.hashCode) +
    (assetSuccessCount.hashCode) +
    (error == null ? 0 : error!.hashCode) +
    (success.hashCode);

  @override
  String toString() => 'AlbumsAddAssetsResponseDto[albumSuccessCount=$albumSuccessCount, assetSuccessCount=$assetSuccessCount, error=$error, success=$success]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumSuccessCount'] = this.albumSuccessCount;
      json[r'assetSuccessCount'] = this.assetSuccessCount;
    if (this.error != null) {
      json[r'error'] = this.error;
    } else {
    //  json[r'error'] = null;
    }
      json[r'success'] = this.success;
    return json;
  }

  /// Returns a new [AlbumsAddAssetsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumsAddAssetsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AlbumsAddAssetsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AlbumsAddAssetsResponseDto(
        albumSuccessCount: mapValueOfType<int>(json, r'albumSuccessCount')!,
        assetSuccessCount: mapValueOfType<int>(json, r'assetSuccessCount')!,
        error: AlbumsAddAssetsResponseDtoErrorEnum.fromJson(json[r'error']),
        success: mapValueOfType<bool>(json, r'success')!,
      );
    }
    return null;
  }

  static List<AlbumsAddAssetsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumsAddAssetsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumsAddAssetsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AlbumsAddAssetsResponseDto> mapFromJson(dynamic json) {
    final map = <String, AlbumsAddAssetsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumsAddAssetsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AlbumsAddAssetsResponseDto-objects as value to a dart map
  static Map<String, List<AlbumsAddAssetsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AlbumsAddAssetsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AlbumsAddAssetsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumSuccessCount',
    'assetSuccessCount',
    'success',
  };
}


class AlbumsAddAssetsResponseDtoErrorEnum {
  /// Instantiate a new enum with the provided [value].
  const AlbumsAddAssetsResponseDtoErrorEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const duplicate = AlbumsAddAssetsResponseDtoErrorEnum._(r'duplicate');
  static const noPermission = AlbumsAddAssetsResponseDtoErrorEnum._(r'no_permission');
  static const notFound = AlbumsAddAssetsResponseDtoErrorEnum._(r'not_found');
  static const unknown = AlbumsAddAssetsResponseDtoErrorEnum._(r'unknown');

  /// List of all possible values in this [enum][AlbumsAddAssetsResponseDtoErrorEnum].
  static const values = <AlbumsAddAssetsResponseDtoErrorEnum>[
    duplicate,
    noPermission,
    notFound,
    unknown,
  ];

  static AlbumsAddAssetsResponseDtoErrorEnum? fromJson(dynamic value) => AlbumsAddAssetsResponseDtoErrorEnumTypeTransformer().decode(value);

  static List<AlbumsAddAssetsResponseDtoErrorEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumsAddAssetsResponseDtoErrorEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumsAddAssetsResponseDtoErrorEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AlbumsAddAssetsResponseDtoErrorEnum] to String,
/// and [decode] dynamic data back to [AlbumsAddAssetsResponseDtoErrorEnum].
class AlbumsAddAssetsResponseDtoErrorEnumTypeTransformer {
  factory AlbumsAddAssetsResponseDtoErrorEnumTypeTransformer() => _instance ??= const AlbumsAddAssetsResponseDtoErrorEnumTypeTransformer._();

  const AlbumsAddAssetsResponseDtoErrorEnumTypeTransformer._();

  String encode(AlbumsAddAssetsResponseDtoErrorEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a AlbumsAddAssetsResponseDtoErrorEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AlbumsAddAssetsResponseDtoErrorEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'duplicate': return AlbumsAddAssetsResponseDtoErrorEnum.duplicate;
        case r'no_permission': return AlbumsAddAssetsResponseDtoErrorEnum.noPermission;
        case r'not_found': return AlbumsAddAssetsResponseDtoErrorEnum.notFound;
        case r'unknown': return AlbumsAddAssetsResponseDtoErrorEnum.unknown;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AlbumsAddAssetsResponseDtoErrorEnumTypeTransformer] instance.
  static AlbumsAddAssetsResponseDtoErrorEnumTypeTransformer? _instance;
}


