// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class OAuthCallbackDto {
  const OAuthCallbackDto({
    this.codeVerifier = const Optional.absent(),
    this.state = const Optional.absent(),
    required this.url,
  });

  /// OAuth code verifier (PKCE)
  final Optional<String> codeVerifier;

  /// OAuth state parameter
  final Optional<String> state;

  /// OAuth callback URL
  final String url;

  static OAuthCallbackDto? fromJson(dynamic value) {
    ApiCompat.upgrade<OAuthCallbackDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      codeVerifier: json.containsKey(r'codeVerifier')
          ? Optional.present(json[r'codeVerifier'] as String)
          : const Optional.absent(),
      state: json.containsKey(r'state') ? Optional.present(json[r'state'] as String) : const Optional.absent(),
      url: json[r'url'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (codeVerifier case Present(:final value)) {
      json[r'codeVerifier'] = value;
    }
    if (state case Present(:final value)) {
      json[r'state'] = value;
    }
    json[r'url'] = url;
    return json;
  }

  OAuthCallbackDto copyWith({Optional<String>? codeVerifier, Optional<String>? state, String? url}) {
    return .new(codeVerifier: codeVerifier ?? this.codeVerifier, state: state ?? this.state, url: url ?? this.url);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is OAuthCallbackDto && codeVerifier == other.codeVerifier && state == other.state && url == other.url);
  }

  @override
  int get hashCode {
    return Object.hashAll([codeVerifier, state, url]);
  }

  @override
  String toString() => 'OAuthCallbackDto(codeVerifier=$codeVerifier, state=$state, url=$url)';
}
