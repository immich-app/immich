//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class PluginContextType {
  /// Instantiate a new enum with the provided [value].
  const PluginContextType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const asset = PluginContextType._(r'asset');
  static const album = PluginContextType._(r'album');
  static const person = PluginContextType._(r'person');

  /// List of all possible values in this [enum][PluginContextType].
  static const values = <PluginContextType>[
    asset,
    album,
    person,
  ];

  static PluginContextType? fromJson(dynamic value) => PluginContextTypeTypeTransformer().decode(value);

  static List<PluginContextType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PluginContextType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PluginContextType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PluginContextType] to String,
/// and [decode] dynamic data back to [PluginContextType].
class PluginContextTypeTypeTransformer {
  factory PluginContextTypeTypeTransformer() => _instance ??= const PluginContextTypeTypeTransformer._();

  const PluginContextTypeTypeTransformer._();

  String encode(PluginContextType data) => data.value;

  /// Decodes a [dynamic value][data] to a PluginContextType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  PluginContextType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'asset': return PluginContextType.asset;
        case r'album': return PluginContextType.album;
        case r'person': return PluginContextType.person;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [PluginContextTypeTypeTransformer] instance.
  static PluginContextTypeTypeTransformer? _instance;
}

