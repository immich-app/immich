import 'package:flutter_test/flutter_test.dart';
import 'package:immich_native_core/immich_native_core.dart';

void main() {
  test('loads the core and returns its version', () {
    expect(version(), isNotEmpty);
  });
}
