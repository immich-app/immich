class ServerConfig {
  final String? oauthButtonText;

  const ServerConfig({this.oauthButtonText});

  ServerConfig copyWith({String? oauthButtonText}) {
    return ServerConfig(
      oauthButtonText: oauthButtonText ?? this.oauthButtonText,
    );
  }

  const ServerConfig.initial() : oauthButtonText = null;

  @override
  String toString() =>
      'ServerConfig(oauthButtonText: ${oauthButtonText ?? '<NULL>'})';

  @override
  bool operator ==(covariant ServerConfig other) {
    if (identical(this, other)) return true;

    return other.oauthButtonText == oauthButtonText;
  }

  @override
  int get hashCode => oauthButtonText.hashCode;
}
