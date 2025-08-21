//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class TranscodePolicy {
  /// Instantiate a new enum with the provided [value].
  const TranscodePolicy._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const all = TranscodePolicy._(r'all');
  static const optimal = TranscodePolicy._(r'optimal');
  static const bitrate = TranscodePolicy._(r'bitrate');
  static const required_ = TranscodePolicy._(r'required');
  static const disabled = TranscodePolicy._(r'disabled');

  /// List of all possible values in this [enum][TranscodePolicy].
  static const values = <TranscodePolicy>[
    all,
    optimal,
    bitrate,
    required_,
    disabled,
  ];

  static TranscodePolicy? fromJson(dynamic value) => TranscodePolicyTypeTransformer().decode(value);

  static List<TranscodePolicy> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TranscodePolicy>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TranscodePolicy.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [TranscodePolicy] to String,
/// and [decode] dynamic data back to [TranscodePolicy].
class TranscodePolicyTypeTransformer {
  factory TranscodePolicyTypeTransformer() => _instance ??= const TranscodePolicyTypeTransformer._();

  const TranscodePolicyTypeTransformer._();

  String encode(TranscodePolicy data) => data.value;

  /// Decodes a [dynamic value][data] to a TranscodePolicy.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  TranscodePolicy? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'all': return TranscodePolicy.all;
        case r'optimal': return TranscodePolicy.optimal;
        case r'bitrate': return TranscodePolicy.bitrate;
        case r'required': return TranscodePolicy.required_;
        case r'disabled': return TranscodePolicy.disabled;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [TranscodePolicyTypeTransformer] instance.
  static TranscodePolicyTypeTransformer? _instance;
}

