abstract interface class IAuthenticationApiRepository {
  /// Returns the access token on successful login
  Future<String?> login(String email, String password);

  /// Returns the OAuth URL
  Future<String?> startOAuth({required String redirectUri});

  /// Returns the access token on successful oauth login
  Future<String?> finishOAuth(String url);
}
