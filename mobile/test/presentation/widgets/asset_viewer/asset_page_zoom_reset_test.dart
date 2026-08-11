import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/generated/codegen_loader.g.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_page.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

import '../../../fixtures/asset.stub.dart';

/// Timeline displaying a single asset that we can swap
class _SwappableTimelineService extends TimelineService {
  BaseAsset asset;
  _SwappableTimelineService(this.asset)
    : super((
        assetSource: (_, __) async => [],
        bucketSource: () => Stream.value(const [Bucket(assetCount: 1)]),
        origin: TimelineOrigin.main,
      ));

  @override
  int get totalAssets => 1;
  @override
  BaseAsset? getAssetSafe(int index) => index == 0 ? asset : null;
}

class _ZoomedNotifier extends AssetViewerStateNotifier {
  @override
  AssetViewerState build() {
    super.build();
    return AssetViewerState(currentAsset: LocalAssetStub.image1, isZoomed: true);
  }
}

void main() {
  testWidgets('resets zoom when the displayed asset is replaced on reload', (tester) async {
    final timeline = _SwappableTimelineService(LocalAssetStub.image1);
    final container = ProviderContainer(
      overrides: [
        timelineServiceProvider.overrideWithValue(timeline),
        assetViewerProvider.overrideWith(_ZoomedNotifier.new),
      ],
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
    // Ignore any image load errors
    tester.takeException();

    expect(container.read(assetViewerProvider).isZoomed, isTrue);

    // Swap the asset, simulating a delete
    timeline.asset = LocalAssetStub.image2;
    EventStream.shared.emit(const TimelineReloadEvent());

    await tester.idle();
    await tester.pump();
    tester.takeException();

    expect(container.read(assetViewerProvider).isZoomed, isFalse);
  });
}
