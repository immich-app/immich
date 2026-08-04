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
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.page.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:mocktail/mocktail.dart';

import '../../../fixtures/asset.stub.dart';
import '../../../unit/presentation/presentation_context.dart';

final _uploadedAsset = RemoteAsset(
  id: 'remote-id',
  name: 'uploaded.jpg',
  ownerId: 'owner-id',
  checksum: 'remote-checksum',
  type: AssetType.image,
  createdAt: DateTime(2026),
  updatedAt: DateTime(2026),
  isEdited: false,
);

class _UploadedAssetViewerNotifier extends AssetViewerStateNotifier {
  @override
  AssetViewerState build() {
    super.build();
    return AssetViewerState(currentAsset: _uploadedAsset);
  }
}

TimelineService _viewIntentTimeline() {
  return TimelineService((
    assetSource: (_, __) async => [LocalAssetStub.image1],
    bucketSource: () => Stream.value(const [Bucket(assetCount: 1)]),
    origin: TimelineOrigin.deepLink,
  ));
}

void main() {
  late PresentationContext presentationContext;

  setUp(() async {
    await initializeDateFormatting();
    presentationContext = await PresentationContext.create();
    when(() => presentationContext.service.asset.service.watchAsset(any())).thenAnswer((_) => const Stream.empty());
  });

  tearDown(() async {
    await presentationContext.dispose();
  });

  testWidgets('keeps uploaded remote asset when it is missing from a deep-link timeline reload', (tester) async {
    final timeline = _viewIntentTimeline();
    addTearDown(timeline.dispose);

    late ProviderContainer container;
    await tester.pumpWidget(
      EasyLocalization(
        supportedLocales: locales.values.toList(),
        path: translationsPath,
        startLocale: locales.values.first,
        fallbackLocale: locales.values.first,
        saveLocale: false,
        useFallbackTranslations: true,
        assetLoader: const CodegenLoader(),
        child: ProviderScope(
          overrides: [
            ...presentationContext.overrides,
            timelineServiceProvider.overrideWithValue(timeline),
            assetViewerProvider.overrideWith(_UploadedAssetViewerNotifier.new),
          ],
          child: Builder(
            builder: (context) {
              container = ProviderScope.containerOf(context);
              return MaterialApp(
                localizationsDelegates: context.localizationDelegates,
                supportedLocales: context.supportedLocales,
                locale: context.locale,
                home: const Material(child: AssetViewer(initialIndex: 0)),
              );
            },
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));
    tester.takeException();

    EventStream.shared.emit(const TimelineReloadEvent());
    await tester.pump();
    await tester.pump();
    tester.takeException();

    expect(container.read(assetViewerProvider).currentAsset, same(_uploadedAsset));
  });
}
