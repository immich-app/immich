import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/widgets/images/local_image_provider.dart';

void main() {
  group('LocalFullImageProvider.previewTargetSize', () {
    // a typical phone preview box (logical size * devicePixelRatio).
    const boxW = 1179.0;
    const boxH = 2556.0;
    const oldBox = Size(boxW, boxH);

    test('normal landscape keeps the exact old box (no preview regression)', () {
      // 4:3, cover long edge ~3407 < 16384 -> not gated, regardless of previewIsFinal.
      expect(LocalFullImageProvider.previewTargetSize(boxW, boxH, 4032, 3024, previewIsFinal: true), oldBox);
      expect(LocalFullImageProvider.previewTargetSize(boxW, boxH, 4032, 3024, previewIsFinal: false), oldBox);
    });

    test('normal portrait keeps the exact old box', () {
      expect(LocalFullImageProvider.previewTargetSize(boxW, boxH, 3024, 4032, previewIsFinal: true), oldBox);
    });

    test('null or zero dims fall back to the old box', () {
      expect(LocalFullImageProvider.previewTargetSize(boxW, boxH, null, null, previewIsFinal: true), oldBox);
      expect(LocalFullImageProvider.previewTargetSize(boxW, boxH, 0, 0, previewIsFinal: true), oldBox);
      expect(LocalFullImageProvider.previewTargetSize(boxW, boxH, 1000, 0, previewIsFinal: true), oldBox);
    });

    test('extreme panorama, FINAL preview (load-original off): capped at the texture limit, ratio kept', () {
      final t = LocalFullImageProvider.previewTargetSize(boxW, boxH, 1000, 30000, previewIsFinal: true);
      expect(t, isNot(oldBox));
      expect(t.longestSide, closeTo(16384, 1));
      expect(t.width / t.height, closeTo(1000 / 30000, 1e-6));
    });

    test('extreme panorama, NON-final preview (load-original on): light, capped at screen long edge, ratio kept', () {
      final t = LocalFullImageProvider.previewTargetSize(boxW, boxH, 1000, 30000, previewIsFinal: false);
      expect(t, isNot(oldBox));
      expect(t.longestSide, closeTo(boxH, 1)); // screen long edge = max(boxW, boxH), the original follows at 16384
      expect(t.width / t.height, closeTo(1000 / 30000, 1e-6));
    });

    test('extreme but small source is never upscaled', () {
      // ratio 40 -> gated, but the source long edge (2000) < texture limit so scale clamps to 1.0.
      expect(
        LocalFullImageProvider.previewTargetSize(boxW, boxH, 50, 2000, previewIsFinal: true),
        const Size(50, 2000),
      );
    });

    test('narrow image is gated in but not upscaled (long edge already under the texture limit)', () {
      // ratio 100: cover overshoots 16384 so it's gated, but the source long edge (10000) < 16384 -> scale clamps to 1.0.
      expect(
        LocalFullImageProvider.previewTargetSize(boxW, boxH, 100, 10000, previewIsFinal: true),
        const Size(100, 10000),
      );
    });

    test('gate boundary: at the texture limit keeps the old box, just over switches to the fix', () {
      // square source -> coverLong == the box long edge.
      expect(
        LocalFullImageProvider.previewTargetSize(16384, 100, 1000, 1000, previewIsFinal: true),
        const Size(16384, 100),
      );
      final over = LocalFullImageProvider.previewTargetSize(16385, 100, 1000, 1000, previewIsFinal: true);
      expect(over, isNot(const Size(16385, 100)));
      expect(over, const Size(1000, 1000));
    });
  });

  group('LocalFullImageProvider equality', () {
    LocalFullImageProvider make({int? width, int? height}) => LocalFullImageProvider(
      id: 'a',
      assetType: AssetType.image,
      size: const Size(100, 200),
      isAnimated: false,
      width: width,
      height: height,
    );

    test('same id/size/isAnimated but different w/h are not equal (distinct cache entries)', () {
      expect(make(width: 1000, height: 30000) == make(width: 4032, height: 3024), isFalse);
    });

    test('identical config is equal and shares a hashCode', () {
      final a = make(width: 100, height: 200);
      final b = make(width: 100, height: 200);
      expect(a, b);
      expect(a.hashCode, b.hashCode);
    });
  });
}
