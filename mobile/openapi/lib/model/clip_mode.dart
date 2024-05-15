//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class CLIPMode {
  /// Instantiate a new enum with the provided [value].
  const CLIPMode._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const vision = CLIPMode._(r'vision');
  static const text = CLIPMode._(r'text');

  /// List of all possible values in this [enum][CLIPMode].
  static const values = <CLIPMode>[
    vision,
    text,
  ];

  static CLIPMode? fromJson(dynamic value) => CLIPModeTypeTransformer().decode(value);

  static List<CLIPMode> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CLIPMode>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CLIPMode.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [CLIPMode] to String,
/// and [decode] dynamic data back to [CLIPMode].
class CLIPModeTypeTransformer {
  factory CLIPModeTypeTransformer() => _instance ??= const CLIPModeTypeTransformer._();

  const CLIPModeTypeTransformer._();

  String encode(CLIPMode data) => data.value;

  /// Decodes a [dynamic value][data] to a CLIPMode.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  CLIPMode? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'vision': return CLIPMode.vision;
        case r'text': return CLIPMode.text;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [CLIPModeTypeTransformer] instance.
  static CLIPModeTypeTransformer? _instance;
}

