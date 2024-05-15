//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ToneMapping {
  /// Instantiate a new enum with the provided [value].
  const ToneMapping._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const hable = ToneMapping._(r'hable');
  static const mobius = ToneMapping._(r'mobius');
  static const reinhard = ToneMapping._(r'reinhard');
  static const disabled = ToneMapping._(r'disabled');

  /// List of all possible values in this [enum][ToneMapping].
  static const values = <ToneMapping>[
    hable,
    mobius,
    reinhard,
    disabled,
  ];

  static ToneMapping? fromJson(dynamic value) => ToneMappingTypeTransformer().decode(value);

  static List<ToneMapping> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ToneMapping>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ToneMapping.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ToneMapping] to String,
/// and [decode] dynamic data back to [ToneMapping].
class ToneMappingTypeTransformer {
  factory ToneMappingTypeTransformer() => _instance ??= const ToneMappingTypeTransformer._();

  const ToneMappingTypeTransformer._();

  String encode(ToneMapping data) => data.value;

  /// Decodes a [dynamic value][data] to a ToneMapping.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ToneMapping? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'hable': return ToneMapping.hable;
        case r'mobius': return ToneMapping.mobius;
        case r'reinhard': return ToneMapping.reinhard;
        case r'disabled': return ToneMapping.disabled;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ToneMappingTypeTransformer] instance.
  static ToneMappingTypeTransformer? _instance;
}

