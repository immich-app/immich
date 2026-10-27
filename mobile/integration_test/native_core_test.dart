import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:native_core/native_core.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  test('native core loads on device', () {
    expect(version(), isNotEmpty);
  });
}
