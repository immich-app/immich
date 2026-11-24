import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/models/auth/login_response.model.dart';
import 'package:openapi/api.dart';

void main() {
  test('fromDto stores a null name and profile image path as empty strings', () {
    final response = LoginResponse.fromDto(
      LoginResponseDto(
        accessToken: 'token',
        isAdmin: false,
        isOnboarded: true,
        name: null,
        profileImagePath: null,
        shouldChangePassword: false,
        userEmail: 'user@immich.app',
        userId: 'user1',
      ),
    );

    expect(response.name, '');
    expect(response.profileImagePath, '');
  });
}
