//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class PluginContext {
  /// Instantiate a new enum with the provided [value].
  const PluginContext._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const asset = PluginContext._(r'asset');
  static const album = PluginContext._(r'album');
  static const person = PluginContext._(r'person');

  /// List of all possible values in this [enum][PluginContext].
  static const values = <PluginContext>[
    asset,
    album,
    person,
  ];

  static PluginContext? fromJson(dynamic value) => PluginContextTypeTransformer().decode(value);

  static List<PluginContext> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PluginContext>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PluginContext.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PluginContext] to String,
/// and [decode] dynamic data back to [PluginContext].
class PluginContextTypeTransformer {
  factory PluginContextTypeTransformer() => _instance ??= const PluginContextTypeTransformer._();

  const PluginContextTypeTransformer._();

  String encode(PluginContext data) => data.value;

  /// Decodes a [dynamic value][data] to a PluginContext.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  PluginContext? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'asset': return PluginContext.asset;
        case r'album': return PluginContext.album;
        case r'person': return PluginContext.person;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [PluginContextTypeTransformer] instance.
  static PluginContextTypeTransformer? _instance;
}

