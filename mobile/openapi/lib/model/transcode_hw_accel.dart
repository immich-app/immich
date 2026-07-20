//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Transcode hardware acceleration
enum TranscodeHWAccel {
  nvenc._(r'nvenc'),
  qsv._(r'qsv'),
  vaapi._(r'vaapi'),
  rkmpp._(r'rkmpp'),
  disabled._(r'disabled'),
  ;

  /// Instantiate a new enum with the provided value.
  const TranscodeHWAccel._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [TranscodeHWAccel] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static TranscodeHWAccel? fromJson(dynamic value) => TranscodeHWAccelTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [TranscodeHWAccel]
  /// that were successfully decoded from the passed [JSON][json].
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

  /// Encodes this enum as a value suitable for JSON.
  String encode(TranscodeHWAccel data) => data._value;

  /// Returns the instance of [TranscodeHWAccel] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  TranscodeHWAccel? decode(dynamic data, {bool allowNull = true}) {
    if (data is TranscodeHWAccel) {
      return data;
    }
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

  /// The singleton instance of this transformer.
  static TranscodeHWAccelTypeTransformer? _instance;
}

