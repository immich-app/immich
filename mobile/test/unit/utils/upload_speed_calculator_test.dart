import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/upload_speed_calculator.dart';

void main() {
  group('UploadSpeedCalculator.formatSpeed', () {
    test('shows the not-available placeholder for a non-positive speed', () {
      expect(UploadSpeedCalculator.formatSpeed(0.0), '-- MB/s');
      // -1 is the sentinel returned before enough samples exist.
      expect(UploadSpeedCalculator.formatSpeed(-1.0), '-- MB/s');
    });

    test('shows MB/s with one decimal at or above 1 MB/s', () {
      expect(UploadSpeedCalculator.formatSpeed(1.0), '1.0 MB/s');
      expect(UploadSpeedCalculator.formatSpeed(1.24), '1.2 MB/s');
      expect(UploadSpeedCalculator.formatSpeed(2.46), '2.5 MB/s');
      expect(UploadSpeedCalculator.formatSpeed(12.34), '12.3 MB/s');
    });

    test('shows whole kB/s below 1 MB/s', () {
      expect(UploadSpeedCalculator.formatSpeed(0.779), '779 kB/s');
      expect(UploadSpeedCalculator.formatSpeed(0.5), '500 kB/s');
      expect(UploadSpeedCalculator.formatSpeed(0.25), '250 kB/s');
    });
  });

  group('UploadSpeedManager.totalSpeed', () {
    test('is zero when no uploads are tracked', () {
      final manager = UploadSpeedManager();
      expect(manager.totalSpeed, 0.0);
    });

    test('ignores calculators that have no reading yet', () {
      final manager = UploadSpeedManager();
      // A freshly created calculator reports -1 until it has samples; those
      // sentinels must not drag the total negative.
      manager.getCalculator('a');
      manager.getCalculator('b');
      expect(manager.totalSpeed, 0.0);
    });
  });
}
