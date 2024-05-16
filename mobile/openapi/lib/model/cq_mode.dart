//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class CQMode {
  /// Instantiate a new enum with the provided [value].
  const CQMode._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const auto = CQMode._(r'auto');
  static const cqp = CQMode._(r'cqp');
  static const icq = CQMode._(r'icq');

  /// List of all possible values in this [enum][CQMode].
  static const values = <CQMode>[
    auto,
    cqp,
    icq,
  ];

  static CQMode? fromJson(dynamic value) => CQModeTypeTransformer().decode(value);

  static List<CQMode> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CQMode>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CQMode.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [CQMode] to String,
/// and [decode] dynamic data back to [CQMode].
class CQModeTypeTransformer {
  factory CQModeTypeTransformer() => _instance ??= const CQModeTypeTransformer._();

  const CQModeTypeTransformer._();

  String encode(CQMode data) => data.value;

  /// Decodes a [dynamic value][data] to a CQMode.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  CQMode? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'auto': return CQMode.auto;
        case r'cqp': return CQMode.cqp;
        case r'icq': return CQMode.icq;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [CQModeTypeTransformer] instance.
  static CQModeTypeTransformer? _instance;
}

