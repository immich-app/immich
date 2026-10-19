import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/presentation/widgets/images/one_frame_multi_image_stream_completer.dart';
import 'package:immich_mobile/presentation/widgets/images/progressive_image.widget.dart';

class _ProgressiveProvider extends ImageProvider<_ProgressiveProvider> {
  const _ProgressiveProvider(this.frames);

  final Stream<ImageInfo> frames;

  @override
  Future<_ProgressiveProvider> obtainKey(ImageConfiguration configuration) => SynchronousFuture(this);

  @override
  ImageStreamCompleter loadImage(_ProgressiveProvider key, ImageDecoderCallback decode) =>
      OneFramePlaceholderImageStreamCompleter(frames);
}

void main() {
  // Issue https://github.com/immich-app/immich/issues/29727: [Image] stops iterating through [ImageProvider] while Android's "Remove animations" is enabled
  // This caused us to get stuck rendering a low quality image
  for (final disableAnimations in [false, true]) {
    final state = disableAnimations ? 'disabled' : 'enabled';

    testWidgets('should keep refining a progressive image while animations are $state', (tester) async {
      final frames = StreamController<ImageInfo>();
      addTearDown(frames.close);

      final (thumbnail, preview) = (await tester.runAsync(
        () async => (await createTestImage(width: 8, height: 8), await createTestImage(width: 64, height: 64)),
      ))!;

      await tester.pumpWidget(
        MediaQuery(
          data: MediaQueryData(disableAnimations: disableAnimations),
          child: MaterialApp(
            home: ProgressiveImage(
              provider: _ProgressiveProvider(frames.stream),
              builder: (context, provider) => Image(image: provider, gaplessPlayback: true),
            ),
          ),
        ),
      );

      frames.add(ImageInfo(image: thumbnail));
      await tester.pump();
      await tester.pump();
      expect(tester.widget<RawImage>(find.byType(RawImage)).image?.width, 8);

      frames.add(ImageInfo(image: preview));
      await tester.pump();
      await tester.pump();
      expect(tester.widget<RawImage>(find.byType(RawImage)).image?.width, 64);
    });
  }
}
