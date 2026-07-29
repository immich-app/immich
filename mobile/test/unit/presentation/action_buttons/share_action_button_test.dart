import 'dart:async';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';

import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

class _RecordingActionNotifier extends ActionNotifier {
  final List<ShareAssetType> sharedFileTypes = [];

  @override
  void build() {}

  @override
  Future<ActionResult> shareAssets(
    ActionSource source,
    BuildContext context, {
    ShareAssetType fileType = ShareAssetType.original,
    Completer<void>? cancelCompleter,
    void Function(double progress)? onAssetDownloadProgress,
  }) async {
    sharedFileTypes.add(fileType);
    return const ActionResult(count: 1, success: true);
  }
}

class _FakeAssetViewerNotifier extends AssetViewerStateNotifier {
  final BaseAsset asset;

  _FakeAssetViewerNotifier(this.asset);

  @override
  AssetViewerState build() => AssetViewerState(currentAsset: asset);
}

void main() {
  late PresentationContext context;
  late _RecordingActionNotifier actionNotifier;

  setUpAll(() async {
    final db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await SettingsRepository.ensureInitialized(db);
  });

  setUp(() async {
    context = await PresentationContext.create();
    actionNotifier = _RecordingActionNotifier();
    await SettingsRepository.instance.clear([SettingsKey.shareFileType]);
  });

  tearDown(() {
    context.dispose();
  });

  Future<void> pumpShareButton(WidgetTester tester) async {
    final asset = RemoteAssetFactory.create(ownerId: context.currentUser.id);
    await tester.pumpTestWidget(
      context,
      const ShareActionButton(source: ActionSource.viewer),
      overrides: [
        actionProvider.overrideWith(() => actionNotifier),
        assetViewerProvider.overrideWith(() => _FakeAssetViewerNotifier(asset)),
      ],
    );
  }

  Future<void> longPressAndPickPreview(WidgetTester tester) async {
    await tester.longPress(find.byType(BaseActionButton));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.photo_size_select_large_rounded));
    await tester.pumpAndSettle();
  }

  group('ShareActionButton', () {
    testWidgets('single press shares with the configured default quality', (tester) async {
      await pumpShareButton(tester);

      await tester.tap(find.byType(BaseActionButton));
      await tester.pumpAndSettle();

      expect(actionNotifier.sharedFileTypes, [ShareAssetType.original]);
    });

    testWidgets('long press shares with the quality picked in the dialog', (tester) async {
      await pumpShareButton(tester);

      await longPressAndPickPreview(tester);

      expect(actionNotifier.sharedFileTypes, [ShareAssetType.preview]);
    });

    testWidgets('quality picked on long press is a one-time choice and does not change the default', (tester) async {
      await pumpShareButton(tester);

      await longPressAndPickPreview(tester);
      expect(actionNotifier.sharedFileTypes, [ShareAssetType.preview]);

      await tester.tap(find.byType(BaseActionButton));
      await tester.pumpAndSettle();

      expect(actionNotifier.sharedFileTypes, [ShareAssetType.preview, ShareAssetType.original]);
      expect(SettingsRepository.instance.appConfig.share.fileType, ShareAssetType.original);
    });
  });
}
