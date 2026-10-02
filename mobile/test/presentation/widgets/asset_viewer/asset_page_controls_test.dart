import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/generated/codegen_loader.g.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_page.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view.dart';

import '../../../fixtures/asset.stub.dart';
import '../../../unit/presentation/presentation_context.dart';

class _SingleAssetTimelineService extends TimelineService {
  final BaseAsset asset;

  _SingleAssetTimelineService(this.asset)
    : super((
        assetSource: (_, _) async => [],
        bucketSource: () => Stream.value(const [Bucket(assetCount: 1)]),
        origin: TimelineOrigin.main,
      ));

  @override
  int get totalAssets => 1;

  @override
  BaseAsset? getAssetSafe(int index) => index == 0 ? asset : null;
}

void main() {
  late PresentationContext context;

  setUp(() async {
    context = await PresentationContext.create();
  });

  tearDown(() async {
    await context.dispose();
  });

  testWidgets('keeps controls hidden after zooming back out', (tester) async {
    final timeline = _SingleAssetTimelineService(LocalAssetStub.image1);
    final container = ProviderContainer(
      overrides: [...context.overrides, timelineServiceProvider.overrideWithValue(timeline)],
    );
    addTearDown(container.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: EasyLocalization(
          supportedLocales: locales.values.toList(),
          path: translationsPath,
          startLocale: locales.values.first,
          fallbackLocale: locales.values.first,
          saveLocale: false,
          useFallbackTranslations: true,
          assetLoader: const CodegenLoader(),
          child: Builder(
            builder: (context) => MaterialApp(
              localizationsDelegates: context.localizationDelegates,
              supportedLocales: context.supportedLocales,
              locale: context.locale,
              home: const Material(child: AssetPage(index: 0, heroOffset: 0)),
            ),
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 600));

    final controls = container.read(assetViewerProvider.notifier);
    controls.setControls(false);

    final photoView = tester.widget<PhotoView>(find.byType(PhotoView));
    photoView.scaleStateChangedCallback!(PhotoViewScaleState.zoomedIn);
    await tester.pump();
    expect(container.read(assetViewerProvider).isZoomed, isTrue);

    photoView.scaleStateChangedCallback!(PhotoViewScaleState.initial);
    await tester.pump();

    expect(container.read(assetViewerProvider).isZoomed, isFalse);
    expect(container.read(assetViewerProvider).showingControls, isFalse);
  });
}
