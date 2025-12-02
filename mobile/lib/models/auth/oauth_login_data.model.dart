class OAuthLoginData {
  final String serverUrl;
  final String state;
  final String codeVerifier;

  const OAuthLoginData({required this.serverUrl, required this.state, required this.codeVerifier});
}
