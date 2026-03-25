import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/presentation/widgets/timeline/dynamic_layout_threshold.dart';

void main() {
  group('resolveTimelineDynamicLayoutThreshold', () {
    test('uses phone fallback when unset', () {
      expect(resolveTimelineDynamicLayoutThreshold(isMobile: true, configuredThreshold: null), 2);
    });

    test('uses tablet fallback when unset', () {
      expect(resolveTimelineDynamicLayoutThreshold(isMobile: false, configuredThreshold: null), 3);
    });

    test('uses explicit configured threshold', () {
      for (final threshold in [2, 3, 4, 5, 6]) {
        expect(resolveTimelineDynamicLayoutThreshold(isMobile: true, configuredThreshold: threshold), threshold);
        expect(resolveTimelineDynamicLayoutThreshold(isMobile: false, configuredThreshold: threshold), threshold);
      }
    });
  });

  group('shouldUseDynamicLayout', () {
    test('disables 3-column dynamic layout when threshold is 2', () {
      expect(shouldUseDynamicLayout(columnCount: 3, isMobile: true, configuredThreshold: 2), isFalse);
    });

    test('enables 3-column dynamic layout when threshold is 3', () {
      expect(shouldUseDynamicLayout(columnCount: 3, isMobile: true, configuredThreshold: 3), isTrue);
    });

    test('enables 6-column dynamic layout when threshold is 6', () {
      expect(shouldUseDynamicLayout(columnCount: 6, isMobile: true, configuredThreshold: 6), isTrue);
    });
  });
}
