// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class OAuthConfigDto {
  const OAuthConfigDto({
    this.codeChallenge = const Optional.absent(),
    required this.redirectUri,
    this.state = const Optional.absent(),
  });

  /// OAuth code challenge (PKCE)
  final Optional<String> codeChallenge;

  /// OAuth redirect URI
  final String redirectUri;

  /// OAuth state parameter
  final Optional<String> state;

  static OAuthConfigDto? fromJson(dynamic value) {
    ApiCompat.upgrade<OAuthConfigDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      codeChallenge: json.containsKey(r'codeChallenge')
          ? Optional.present(json[r'codeChallenge'] as String)
          : const Optional.absent(),
      redirectUri: json[r'redirectUri'] as String,
      state: json.containsKey(r'state') ? Optional.present(json[r'state'] as String) : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (codeChallenge case Present(:final value)) {
      json[r'codeChallenge'] = value;
    }
    json[r'redirectUri'] = redirectUri;
    if (state case Present(:final value)) {
      json[r'state'] = value;
    }
    return json;
  }

  OAuthConfigDto copyWith({Optional<String>? codeChallenge, String? redirectUri, Optional<String>? state}) {
    return .new(
      codeChallenge: codeChallenge ?? this.codeChallenge,
      redirectUri: redirectUri ?? this.redirectUri,
      state: state ?? this.state,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is OAuthConfigDto &&
            codeChallenge == other.codeChallenge &&
            redirectUri == other.redirectUri &&
            state == other.state);
  }

  @override
  int get hashCode {
    return Object.hashAll([codeChallenge, redirectUri, state]);
  }

  @override
  String toString() => 'OAuthConfigDto(codeChallenge=$codeChallenge, redirectUri=$redirectUri, state=$state)';
}
