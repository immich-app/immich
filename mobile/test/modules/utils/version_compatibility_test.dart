import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/version_compatibility.dart';

void main() {
  test('getVersionCompatibilityMessage', () {
    String? result;

    result = getVersionCompatibilityMessage(1, 0, 2, 0);
    expect(
      result,
      'Your app major version is not compatible with the server!',
    );

    result = getVersionCompatibilityMessage(1, 106, 1, 105);
    expect(
      result,
      'Your app minor version is not compatible with the server! Please update your server to version v1.106.0 or newer to login',
    );

    result = getVersionCompatibilityMessage(1, 107, 1, 105);
    expect(
      result,
      'Your app minor version is not compatible with the server! Please update your server to version v1.106.0 or newer to login',
    );

    result = getVersionCompatibilityMessage(1, 106, 1, 106);
    expect(result, null);

    result = getVersionCompatibilityMessage(1, 107, 1, 106);
    expect(result, null);

    result = getVersionCompatibilityMessage(1, 107, 1, 108);
    expect(result, null);
  });
}
