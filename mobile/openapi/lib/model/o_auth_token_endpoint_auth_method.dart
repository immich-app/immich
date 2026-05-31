// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// OAuth token endpoint auth method
enum OAuthTokenEndpointAuthMethod {
  clientSecretPost._(r'client_secret_post'),
  clientSecretBasic._(r'client_secret_basic'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const OAuthTokenEndpointAuthMethod._(this.value);

  final String value;

  static OAuthTokenEndpointAuthMethod? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
