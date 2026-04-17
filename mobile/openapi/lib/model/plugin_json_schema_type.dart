//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class PluginJsonSchemaType {
  /// Instantiate a new enum with the provided [value].
  const PluginJsonSchemaType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const string = PluginJsonSchemaType._(r'string');
  static const number = PluginJsonSchemaType._(r'number');
  static const integer = PluginJsonSchemaType._(r'integer');
  static const boolean = PluginJsonSchemaType._(r'boolean');
  static const object = PluginJsonSchemaType._(r'object');
  static const array = PluginJsonSchemaType._(r'array');
  static const null_ = PluginJsonSchemaType._(r'null');

  /// List of all possible values in this [enum][PluginJsonSchemaType].
  static const values = <PluginJsonSchemaType>[
    string,
    number,
    integer,
    boolean,
    object,
    array,
    null_,
  ];

  static PluginJsonSchemaType? fromJson(dynamic value) => PluginJsonSchemaTypeTypeTransformer().decode(value);

  static List<PluginJsonSchemaType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PluginJsonSchemaType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PluginJsonSchemaType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PluginJsonSchemaType] to String,
/// and [decode] dynamic data back to [PluginJsonSchemaType].
class PluginJsonSchemaTypeTypeTransformer {
  factory PluginJsonSchemaTypeTypeTransformer() => _instance ??= const PluginJsonSchemaTypeTypeTransformer._();

  const PluginJsonSchemaTypeTypeTransformer._();

  String encode(PluginJsonSchemaType data) => data.value;

  /// Decodes a [dynamic value][data] to a PluginJsonSchemaType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  PluginJsonSchemaType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'string': return PluginJsonSchemaType.string;
        case r'number': return PluginJsonSchemaType.number;
        case r'integer': return PluginJsonSchemaType.integer;
        case r'boolean': return PluginJsonSchemaType.boolean;
        case r'object': return PluginJsonSchemaType.object;
        case r'array': return PluginJsonSchemaType.array;
        case r'null': return PluginJsonSchemaType.null_;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [PluginJsonSchemaTypeTypeTransformer] instance.
  static PluginJsonSchemaTypeTypeTransformer? _instance;
}

