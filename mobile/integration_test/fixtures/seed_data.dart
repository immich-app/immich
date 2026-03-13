import 'dart:convert';
import 'dart:io';

import '../common/test_app.dart';

/// Seeds the test Immich server with initial data for integration tests.
class TestDataSeeder {
  String? _adminAccessToken;
  String? _secondUserAccessToken;

  /// Second test user credentials.
  static const secondUserEmail = 'testuser@immich.app';
  static const secondUserName = 'Test User';
  static const secondUserPassword = 'testuser123';

  /// Run the full seed sequence.
  Future<void> seed() async {
    await _signUpAdmin();
    await _loginAdmin();
    await _createSecondUser();
    await _loginSecondUser();
  }

  /// Sign up the admin user (first-time setup).
  Future<void> _signUpAdmin() async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(
        Uri.parse('$testServerUrl/api/auth/admin-sign-up'),
      );
      request.headers.set('Content-Type', 'application/json');
      request.write(jsonEncode({
        'name': 'Test Admin',
        'email': testEmail,
        'password': testPassword,
      }));
      final response = await request.close();
      // 201 = created, 400 = already exists — both are fine
      if (response.statusCode >= 500) {
        final body = await response.transform(utf8.decoder).join();
        throw StateError(
          'Admin sign-up failed (${response.statusCode}): $body',
        );
      }
      await response.drain();
    } finally {
      client.close();
    }
  }

  /// Log in as admin and store the access token.
  Future<void> _loginAdmin() async {
    _adminAccessToken = await _login(testEmail, testPassword);
  }

  /// Create a second (non-admin) user via the admin API.
  Future<void> _createSecondUser() async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(
        Uri.parse('$testServerUrl/api/admin/users'),
      );
      request.headers.set('Content-Type', 'application/json');
      request.headers.set('Authorization', 'Bearer $adminAccessToken');
      request.write(jsonEncode({
        'email': secondUserEmail,
        'password': secondUserPassword,
        'name': secondUserName,
      }));
      final response = await request.close();
      // 201 = created, 409 = already exists — both are fine
      if (response.statusCode >= 500) {
        final body = await response.transform(utf8.decoder).join();
        throw StateError(
          'Create user failed (${response.statusCode}): $body',
        );
      }
      await response.drain();
    } finally {
      client.close();
    }
  }

  /// Log in as the second user and store their token.
  Future<void> _loginSecondUser() async {
    _secondUserAccessToken =
        await _login(secondUserEmail, secondUserPassword);
  }

  /// Generic login helper — returns access token.
  Future<String> _login(String email, String password) async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(
        Uri.parse('$testServerUrl/api/auth/login'),
      );
      request.headers.set('Content-Type', 'application/json');
      request.write(jsonEncode({
        'email': email,
        'password': password,
      }));
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      if (response.statusCode != 201) {
        throw StateError('Login failed (${response.statusCode}): $body');
      }
      final json = jsonDecode(body) as Map<String, dynamic>;
      return json['accessToken'] as String;
    } finally {
      client.close();
    }
  }

  /// Get the admin access token (must call [seed] first).
  String get adminAccessToken {
    if (_adminAccessToken == null) {
      throw StateError('Must call seed() before accessing adminAccessToken');
    }
    return _adminAccessToken!;
  }

  /// Backward-compatible alias for [adminAccessToken].
  String get accessToken => adminAccessToken;

  /// Get the second user's access token (must call [seed] first).
  String get secondUserAccessToken {
    if (_secondUserAccessToken == null) {
      throw StateError(
        'Must call seed() before accessing secondUserAccessToken',
      );
    }
    return _secondUserAccessToken!;
  }

  /// Get the second user's ID by querying the server.
  Future<String> getSecondUserId() async {
    final client = HttpClient();
    try {
      final request = await client.getUrl(
        Uri.parse('$testServerUrl/api/users/me'),
      );
      request.headers.set('Authorization', 'Bearer $secondUserAccessToken');
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      if (response.statusCode != 200) {
        throw StateError(
          'Get user failed (${response.statusCode}): $body',
        );
      }
      final json = jsonDecode(body) as Map<String, dynamic>;
      return json['id'] as String;
    } finally {
      client.close();
    }
  }

  /// Create a shared space via API (returns space ID).
  Future<String> createSpace(String name, {String? token}) async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(
        Uri.parse('$testServerUrl/api/spaces'),
      );
      request.headers.set('Content-Type', 'application/json');
      request.headers.set(
        'Authorization',
        'Bearer ${token ?? adminAccessToken}',
      );
      request.write(jsonEncode({'name': name}));
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      if (response.statusCode != 201) {
        throw StateError(
          'Create space failed (${response.statusCode}): $body',
        );
      }
      final json = jsonDecode(body) as Map<String, dynamic>;
      return json['id'] as String;
    } finally {
      client.close();
    }
  }

  /// Add a member to a space via API.
  Future<void> addSpaceMember(
    String spaceId,
    String userId, {
    String? token,
  }) async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(
        Uri.parse('$testServerUrl/api/spaces/$spaceId/members'),
      );
      request.headers.set('Content-Type', 'application/json');
      request.headers.set(
        'Authorization',
        'Bearer ${token ?? adminAccessToken}',
      );
      request.write(jsonEncode({'userId': userId}));
      final response = await request.close();
      if (response.statusCode >= 400) {
        final body = await response.transform(utf8.decoder).join();
        throw StateError(
          'Add member failed (${response.statusCode}): $body',
        );
      }
      await response.drain();
    } finally {
      client.close();
    }
  }
}
