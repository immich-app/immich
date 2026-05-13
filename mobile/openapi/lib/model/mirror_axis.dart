//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Axis to mirror along
class MirrorAxis {
  /// Instantiate a new enum with the provided [value].
  const MirrorAxis._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const horizontal = MirrorAxis._(r'horizontal');
  static const vertical = MirrorAxis._(r'vertical');

  /// List of all possible values in this [enum][MirrorAxis].
  static const values = <MirrorAxis>[
    horizontal,
    vertical,
  ];

  static MirrorAxis? fromJson(dynamic value) => MirrorAxisTypeTransformer().decode(value);

  static List<MirrorAxis> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MirrorAxis>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MirrorAxis.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [MirrorAxis] to String,
/// and [decode] dynamic data back to [MirrorAxis].
class MirrorAxisTypeTransformer {
  factory MirrorAxisTypeTransformer() => _instance ??= const MirrorAxisTypeTransformer._();

  const MirrorAxisTypeTransformer._();

  String encode(MirrorAxis data) => data.value;

  /// Decodes a [dynamic value][data] to a MirrorAxis.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  MirrorAxis? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'horizontal': return MirrorAxis.horizontal;
        case r'vertical': return MirrorAxis.vertical;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [MirrorAxisTypeTransformer] instance.
  static MirrorAxisTypeTransformer? _instance;
}

