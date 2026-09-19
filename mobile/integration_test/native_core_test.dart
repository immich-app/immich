import 'package:flutter_test/flutter_test.dart';
import 'package:immich_native_core/immich_native_core.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  test('native core loads on device', () {
    expect(version(), isNotEmpty);
  });
}
