//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ProxyProtocol {
  /// Instantiate a new enum with the provided [value].
  const ProxyProtocol._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const http = ProxyProtocol._(r'http');
  static const https = ProxyProtocol._(r'https');

  /// List of all possible values in this [enum][ProxyProtocol].
  static const values = <ProxyProtocol>[
    http,
    https,
  ];

  static ProxyProtocol? fromJson(dynamic value) => ProxyProtocolTypeTransformer().decode(value);

  static List<ProxyProtocol>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ProxyProtocol>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ProxyProtocol.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ProxyProtocol] to String,
/// and [decode] dynamic data back to [ProxyProtocol].
class ProxyProtocolTypeTransformer {
  factory ProxyProtocolTypeTransformer() => _instance ??= const ProxyProtocolTypeTransformer._();

  const ProxyProtocolTypeTransformer._();

  String encode(ProxyProtocol data) => data.value;

  /// Decodes a [dynamic value][data] to a ProxyProtocol.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ProxyProtocol? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'http': return ProxyProtocol.http;
        case r'https': return ProxyProtocol.https;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ProxyProtocolTypeTransformer] instance.
  static ProxyProtocolTypeTransformer? _instance;
}

