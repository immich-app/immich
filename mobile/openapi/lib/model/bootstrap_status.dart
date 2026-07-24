//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class BootstrapStatus {
  /// Instantiate a new enum with the provided [value].
  const BootstrapStatus._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const notReady = BootstrapStatus._(r'not-ready');
  static const ready = BootstrapStatus._(r'ready');
  static const error = BootstrapStatus._(r'error');

  /// List of all possible values in this [enum][BootstrapStatus].
  static const values = <BootstrapStatus>[
    notReady,
    ready,
    error,
  ];

  static BootstrapStatus? fromJson(dynamic value) => BootstrapStatusTypeTransformer().decode(value);

  static List<BootstrapStatus> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <BootstrapStatus>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = BootstrapStatus.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [BootstrapStatus] to String,
/// and [decode] dynamic data back to [BootstrapStatus].
class BootstrapStatusTypeTransformer {
  factory BootstrapStatusTypeTransformer() => _instance ??= const BootstrapStatusTypeTransformer._();

  const BootstrapStatusTypeTransformer._();

  String encode(BootstrapStatus data) => data.value;

  /// Decodes a [dynamic value][data] to a BootstrapStatus.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  BootstrapStatus? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'not-ready': return BootstrapStatus.notReady;
        case r'ready': return BootstrapStatus.ready;
        case r'error': return BootstrapStatus.error;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [BootstrapStatusTypeTransformer] instance.
  static BootstrapStatusTypeTransformer? _instance;
}

