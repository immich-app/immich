//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class OAuthTokenEndpointAuthMethod {
  /// Instantiate a new enum with the provided [value].
  const OAuthTokenEndpointAuthMethod._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const post = OAuthTokenEndpointAuthMethod._(r'client_secret_post');
  static const basic = OAuthTokenEndpointAuthMethod._(r'client_secret_basic');

  /// List of all possible values in this [enum][OAuthTokenEndpointAuthMethod].
  static const values = <OAuthTokenEndpointAuthMethod>[
    post,
    basic,
  ];

  static OAuthTokenEndpointAuthMethod? fromJson(dynamic value) => OAuthTokenEndpointAuthMethodTypeTransformer().decode(value);

  static List<OAuthTokenEndpointAuthMethod> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <OAuthTokenEndpointAuthMethod>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = OAuthTokenEndpointAuthMethod.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [OAuthTokenEndpointAuthMethod] to String,
/// and [decode] dynamic data back to [OAuthTokenEndpointAuthMethod].
class OAuthTokenEndpointAuthMethodTypeTransformer {
  factory OAuthTokenEndpointAuthMethodTypeTransformer() => _instance ??= const OAuthTokenEndpointAuthMethodTypeTransformer._();

  const OAuthTokenEndpointAuthMethodTypeTransformer._();

  String encode(OAuthTokenEndpointAuthMethod data) => data.value;

  /// Decodes a [dynamic value][data] to a OAuthTokenEndpointAuthMethod.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  OAuthTokenEndpointAuthMethod? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'client_secret_post': return OAuthTokenEndpointAuthMethod.post;
        case r'client_secret_basic': return OAuthTokenEndpointAuthMethod.basic;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [OAuthTokenEndpointAuthMethodTypeTransformer] instance.
  static OAuthTokenEndpointAuthMethodTypeTransformer? _instance;
}

