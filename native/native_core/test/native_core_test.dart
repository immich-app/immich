import 'package:flutter_test/flutter_test.dart';
import 'package:native_core/native_core.dart';

void main() {
  test('loads the core and returns its version', () {
    expect(version(), isNotEmpty);
  });
}
