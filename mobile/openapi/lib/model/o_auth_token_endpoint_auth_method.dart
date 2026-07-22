//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// OAuth token endpoint auth method
enum OAuthTokenEndpointAuthMethod {
  clientSecretPost._(r'client_secret_post'),
  clientSecretBasic._(r'client_secret_basic'),
  ;

  /// Instantiate a new enum with the provided value.
  const OAuthTokenEndpointAuthMethod._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [OAuthTokenEndpointAuthMethod] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static OAuthTokenEndpointAuthMethod? fromJson(dynamic value) => OAuthTokenEndpointAuthMethodTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [OAuthTokenEndpointAuthMethod]
  /// that were successfully decoded from the passed [JSON][json].
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

  /// Encodes this enum as a value suitable for JSON.
  String encode(OAuthTokenEndpointAuthMethod data) => data._value;

  /// Returns the instance of [OAuthTokenEndpointAuthMethod] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  OAuthTokenEndpointAuthMethod? decode(dynamic data, {bool allowNull = true}) {
    if (data is OAuthTokenEndpointAuthMethod) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'client_secret_post': return OAuthTokenEndpointAuthMethod.clientSecretPost;
        case r'client_secret_basic': return OAuthTokenEndpointAuthMethod.clientSecretBasic;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static OAuthTokenEndpointAuthMethodTypeTransformer? _instance;
}

