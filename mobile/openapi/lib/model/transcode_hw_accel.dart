//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class TranscodeHWAccel {
  /// Instantiate a new enum with the provided [value].
  const TranscodeHWAccel._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const nvenc = TranscodeHWAccel._(r'nvenc');
  static const qsv = TranscodeHWAccel._(r'qsv');
  static const vaapi = TranscodeHWAccel._(r'vaapi');
  static const rkmpp = TranscodeHWAccel._(r'rkmpp');
  static const disabled = TranscodeHWAccel._(r'disabled');

  /// List of all possible values in this [enum][TranscodeHWAccel].
  static const values = <TranscodeHWAccel>[
    nvenc,
    qsv,
    vaapi,
    rkmpp,
    disabled,
  ];

  static TranscodeHWAccel? fromJson(dynamic value) => TranscodeHWAccelTypeTransformer().decode(value);

  static List<TranscodeHWAccel> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TranscodeHWAccel>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TranscodeHWAccel.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [TranscodeHWAccel] to String,
/// and [decode] dynamic data back to [TranscodeHWAccel].
class TranscodeHWAccelTypeTransformer {
  factory TranscodeHWAccelTypeTransformer() => _instance ??= const TranscodeHWAccelTypeTransformer._();

  const TranscodeHWAccelTypeTransformer._();

  String encode(TranscodeHWAccel data) => data.value;

  /// Decodes a [dynamic value][data] to a TranscodeHWAccel.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  TranscodeHWAccel? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'nvenc': return TranscodeHWAccel.nvenc;
        case r'qsv': return TranscodeHWAccel.qsv;
        case r'vaapi': return TranscodeHWAccel.vaapi;
        case r'rkmpp': return TranscodeHWAccel.rkmpp;
        case r'disabled': return TranscodeHWAccel.disabled;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [TranscodeHWAccelTypeTransformer] instance.
  static TranscodeHWAccelTypeTransformer? _instance;
}

