//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CreateDeviceInfoDto {
  /// Returns a new [CreateDeviceInfoDto] instance.
  CreateDeviceInfoDto({
    required this.deviceId,
    required this.deviceType,
    this.isAutoBackup,
  });

  String deviceId;

  CreateDeviceInfoDtoDeviceTypeEnum deviceType;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isAutoBackup;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CreateDeviceInfoDto &&
     other.deviceId == deviceId &&
     other.deviceType == deviceType &&
     other.isAutoBackup == isAutoBackup;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (deviceId.hashCode) +
    (deviceType.hashCode) +
    (isAutoBackup == null ? 0 : isAutoBackup!.hashCode);

  @override
  String toString() => 'CreateDeviceInfoDto[deviceId=$deviceId, deviceType=$deviceType, isAutoBackup=$isAutoBackup]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'deviceId'] = deviceId;
      _json[r'deviceType'] = deviceType;
    if (isAutoBackup != null) {
      _json[r'isAutoBackup'] = isAutoBackup;
    } else {
      _json[r'isAutoBackup'] = null;
    }
    return _json;
  }

  /// Returns a new [CreateDeviceInfoDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CreateDeviceInfoDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "CreateDeviceInfoDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "CreateDeviceInfoDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return CreateDeviceInfoDto(
        deviceId: mapValueOfType<String>(json, r'deviceId')!,
        deviceType: CreateDeviceInfoDtoDeviceTypeEnum.fromJson(json[r'deviceType'])!,
        isAutoBackup: mapValueOfType<bool>(json, r'isAutoBackup'),
      );
    }
    return null;
  }

  static List<CreateDeviceInfoDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CreateDeviceInfoDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CreateDeviceInfoDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CreateDeviceInfoDto> mapFromJson(dynamic json) {
    final map = <String, CreateDeviceInfoDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CreateDeviceInfoDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CreateDeviceInfoDto-objects as value to a dart map
  static Map<String, List<CreateDeviceInfoDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CreateDeviceInfoDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CreateDeviceInfoDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'deviceId',
    'deviceType',
  };
}


class CreateDeviceInfoDtoDeviceTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const CreateDeviceInfoDtoDeviceTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const IOS = CreateDeviceInfoDtoDeviceTypeEnum._(r'IOS');
  static const ANDROID = CreateDeviceInfoDtoDeviceTypeEnum._(r'ANDROID');
  static const WEB = CreateDeviceInfoDtoDeviceTypeEnum._(r'WEB');

  /// List of all possible values in this [enum][CreateDeviceInfoDtoDeviceTypeEnum].
  static const values = <CreateDeviceInfoDtoDeviceTypeEnum>[
    IOS,
    ANDROID,
    WEB,
  ];

  static CreateDeviceInfoDtoDeviceTypeEnum? fromJson(dynamic value) => CreateDeviceInfoDtoDeviceTypeEnumTypeTransformer().decode(value);

  static List<CreateDeviceInfoDtoDeviceTypeEnum>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CreateDeviceInfoDtoDeviceTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CreateDeviceInfoDtoDeviceTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [CreateDeviceInfoDtoDeviceTypeEnum] to String,
/// and [decode] dynamic data back to [CreateDeviceInfoDtoDeviceTypeEnum].
class CreateDeviceInfoDtoDeviceTypeEnumTypeTransformer {
  factory CreateDeviceInfoDtoDeviceTypeEnumTypeTransformer() => _instance ??= const CreateDeviceInfoDtoDeviceTypeEnumTypeTransformer._();

  const CreateDeviceInfoDtoDeviceTypeEnumTypeTransformer._();

  String encode(CreateDeviceInfoDtoDeviceTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a CreateDeviceInfoDtoDeviceTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  CreateDeviceInfoDtoDeviceTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data.toString()) {
        case r'IOS': return CreateDeviceInfoDtoDeviceTypeEnum.IOS;
        case r'ANDROID': return CreateDeviceInfoDtoDeviceTypeEnum.ANDROID;
        case r'WEB': return CreateDeviceInfoDtoDeviceTypeEnum.WEB;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [CreateDeviceInfoDtoDeviceTypeEnumTypeTransformer] instance.
  static CreateDeviceInfoDtoDeviceTypeEnumTypeTransformer? _instance;
}


