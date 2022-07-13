//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class DeviceTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const DeviceTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const IOS = DeviceTypeEnum._(r'IOS');
  static const ANDROID = DeviceTypeEnum._(r'ANDROID');
  static const WEB = DeviceTypeEnum._(r'WEB');

  /// List of all possible values in this [enum][DeviceTypeEnum].
  static const values = <DeviceTypeEnum>[
    IOS,
    ANDROID,
    WEB,
  ];

  static DeviceTypeEnum? fromJson(dynamic value) => DeviceTypeEnumTypeTransformer().decode(value);

  static List<DeviceTypeEnum>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DeviceTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DeviceTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [DeviceTypeEnum] to String,
/// and [decode] dynamic data back to [DeviceTypeEnum].
class DeviceTypeEnumTypeTransformer {
  factory DeviceTypeEnumTypeTransformer() => _instance ??= const DeviceTypeEnumTypeTransformer._();

  const DeviceTypeEnumTypeTransformer._();

  String encode(DeviceTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a DeviceTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  DeviceTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data.toString()) {
        case r'IOS': return DeviceTypeEnum.IOS;
        case r'ANDROID': return DeviceTypeEnum.ANDROID;
        case r'WEB': return DeviceTypeEnum.WEB;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [DeviceTypeEnumTypeTransformer] instance.
  static DeviceTypeEnumTypeTransformer? _instance;
}

