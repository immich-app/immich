//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class PluginTriggerType {
  /// Instantiate a new enum with the provided [value].
  const PluginTriggerType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const assetCreate = PluginTriggerType._(r'AssetCreate');
  static const personRecognized = PluginTriggerType._(r'PersonRecognized');

  /// List of all possible values in this [enum][PluginTriggerType].
  static const values = <PluginTriggerType>[
    assetCreate,
    personRecognized,
  ];

  static PluginTriggerType? fromJson(dynamic value) => PluginTriggerTypeTypeTransformer().decode(value);

  static List<PluginTriggerType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PluginTriggerType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PluginTriggerType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PluginTriggerType] to String,
/// and [decode] dynamic data back to [PluginTriggerType].
class PluginTriggerTypeTypeTransformer {
  factory PluginTriggerTypeTypeTransformer() => _instance ??= const PluginTriggerTypeTypeTransformer._();

  const PluginTriggerTypeTypeTransformer._();

  String encode(PluginTriggerType data) => data.value;

  /// Decodes a [dynamic value][data] to a PluginTriggerType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  PluginTriggerType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'AssetCreate': return PluginTriggerType.assetCreate;
        case r'PersonRecognized': return PluginTriggerType.personRecognized;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [PluginTriggerTypeTypeTransformer] instance.
  static PluginTriggerTypeTypeTransformer? _instance;
}

