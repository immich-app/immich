import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/config/share_config.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/share.action.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:mocktail/mocktail.dart';

import '../../../repository.mocks.dart';
import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

void main() {
  late PresentationContext context;
  late MockAssetMediaRepository mediaRepo;

  setUp(() async {
    context = await PresentationContext.create();
    mediaRepo = context.repository.assetMedia.api;
  });

  tearDown(() {
    context.dispose();
  });

  List<Override> savedQuality(ShareAssetType fileType) => [
    appConfigProvider.overrideWithValue(defaultConfig.copyWith(share: ShareConfig(fileType: fileType))),
  ];

  RemoteAsset asset({AssetType type = .image}) => RemoteAssetFactory.create(type: type);

  group('ShareAction', () {
    testWidgets('visible when there are assets to share', (tester) async {
      final action = await tester.pumpActionButton(context, (scope) => ShareAction(assets: [asset()], scope: scope));

      expect(action.isVisible, isTrue);
      expect(action.onSecondaryAction, isNotNull);
      expect(action.label, StaticTranslations.instance.share);
      expect(find.byType(ImmichIconButton), findsOneWidget);
    });

    testWidgets('hidden when the selection is empty', (tester) async {
      final action = await tester.pumpActionButton(context, (scope) => ShareAction(assets: const [], scope: scope));

      expect(action.isVisible, isFalse);
      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('uses the Android share icon on Android', (tester) async {
      debugDefaultTargetPlatformOverride = .android;
      final action = await tester.pumpActionButton(context, (scope) => ShareAction(assets: [asset()], scope: scope));
      debugDefaultTargetPlatformOverride = null;

      expect(action.icon, Icons.share_rounded);
    });

    testWidgets('uses the iOS share icon on iOS', (tester) async {
      debugDefaultTargetPlatformOverride = .iOS;
      final action = await tester.pumpActionButton(context, (scope) => ShareAction(assets: [asset()], scope: scope));
      debugDefaultTargetPlatformOverride = null;

      expect(action.icon, Icons.ios_share_rounded);
    });
  });

  group('quality picker', () {
    testWidgets('offers both original and preview for an image', (tester) async {
      final action = await tester.pumpActionButton(context, (scope) => ShareAction(assets: [asset()], scope: scope));

      unawaited(action.onSecondaryAction!());
      await tester.pumpAndSettle();

      expect(find.text(StaticTranslations.instance.share_original), findsOneWidget);
      expect(find.text(StaticTranslations.instance.share_preview), findsOneWidget);

      await tester.tap(find.text(StaticTranslations.instance.cancel));
      await tester.pumpAndSettle();
    });

    testWidgets('offers only original for a video', (tester) async {
      final action = await tester.pumpActionButton(
        context,
        (scope) => ShareAction(
          assets: [asset(type: .video)],
          scope: scope,
        ),
      );

      unawaited(action.onSecondaryAction!());
      await tester.pumpAndSettle();

      expect(find.text(StaticTranslations.instance.share_original), findsOneWidget);
      expect(find.text(StaticTranslations.instance.share_preview), findsNothing);

      await tester.tap(find.text(StaticTranslations.instance.cancel));
      await tester.pumpAndSettle();
    });
  });

  group('onAction', () {
    testWidgets('shares the assets at the quality saved in settings', (tester) async {
      final target = asset();

      await tester.pumpTestAction(
        context,
        (scope) => ShareAction(assets: [target], scope: scope),
        overrides: savedQuality(.preview),
      );
      await tester.pump(const .new(milliseconds: 500));

      verify(
        () => mediaRepo.shareAssets(
          any(that: contains(target)),
          any(),
          fileType: .preview,
          cancelCompleter: any(named: 'cancelCompleter'),
          onAssetDownloadProgress: any(named: 'onAssetDownloadProgress'),
        ),
      ).called(1);

      await tester.pumpAndSettle();
    });
  });
}
