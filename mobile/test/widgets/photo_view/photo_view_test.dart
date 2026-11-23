import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view.dart';

// Skips the image cache, which would keep its own handle to the image and hide a leak
class _UncachedImageProvider extends ImageProvider<_UncachedImageProvider> {
  const _UncachedImageProvider(this.image);

  final ui.Image image;

  @override
  Future<_UncachedImageProvider> obtainKey(ImageConfiguration configuration) => SynchronousFuture(this);

  @override
  void resolveStreamForKey(
    ImageConfiguration configuration,
    ImageStream stream,
    _UncachedImageProvider key,
    ImageErrorListener handleError,
  ) => stream.setCompleter(OneFrameImageStreamCompleter(SynchronousFuture(ImageInfo(image: image.clone()))));
}

void main() {
  testWidgets('releases the preview and the original once removed', (tester) async {
    final (preview, original) = (await tester.runAsync(
      () async => (await createTestImage(cache: false), await createTestImage(cache: false)),
    ))!;
    addTearDown(preview.dispose);
    addTearDown(original.dispose);

    await tester.pumpWidget(PhotoView(imageProvider: _UncachedImageProvider(preview), index: 0));
    await tester.pumpWidget(PhotoView(imageProvider: _UncachedImageProvider(original), index: 0));
    await tester.pumpWidget(const SizedBox());

    // Only the test itself still holds the images
    expect(preview.debugGetOpenHandleStackTraces(), hasLength(1));
    expect(original.debugGetOpenHandleStackTraces(), hasLength(1));
  });
}
