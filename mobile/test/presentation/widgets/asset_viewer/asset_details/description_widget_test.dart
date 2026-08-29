import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_details/description.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/asset.provider.dart';
import 'package:immich_mobile/services/action.service.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:mocktail/mocktail.dart';

import '../../../../unit/factories/remote_asset_factory.dart';
import '../../../../unit/presentation/presentation_context.dart';

class MockActionService extends Mock implements ActionService {}

void main() {
  late PresentationContext context;
  late MockActionService mockActionService;
  late StreamController<BaseAsset?> assetStreamController;

  setUp(() async {
    context = await PresentationContext.create();
    mockActionService = MockActionService();
    assetStreamController = StreamController<BaseAsset?>.broadcast();
    when(() => context.service.asset.service.watchAsset(any())).thenAnswer((_) => assetStreamController.stream);
  });

  tearDown(() async {
    await assetStreamController.close();
    await context.dispose();
  });

  RemoteAsset owned() => RemoteAssetFactory.create(ownerId: context.currentUser.id);
  RemoteAsset other() => RemoteAssetFactory.create(ownerId: 'other-user');

  Future<void> pumpDescription(
    WidgetTester tester, {
    required BaseAsset asset,
    ExifInfo? exifInfo,
    List<Override> overrides = const [],
    Widget? extraChild,
  }) async {
    await tester.pumpTestWidget(
      context,
      Column(
        children: [
          SheetAssetDescription(asset: asset, exifInfo: exifInfo),
          ?extraChild,
        ],
      ),
      overrides: [
        actionServiceProvider.overrideWithValue(mockActionService),
        foregroundUploadServiceProvider.overrideWithValue(context.service.upload),
        ...overrides,
      ],
    );
  }

  testWidgets('shows existing description in TextField', (tester) async {
    final asset = owned();
    await pumpDescription(
      tester,
      asset: asset,
      exifInfo: const ExifInfo(description: 'Initial description'),
    );

    expect(find.text('Initial description'), findsOneWidget);
  });

  testWidgets('shows placeholder when description is empty/null', (tester) async {
    final asset = owned();
    await pumpDescription(tester, asset: asset, exifInfo: null);

    final textField = tester.widget<TextField>(find.byType(TextField));
    expect(textField.controller?.text, isEmpty);
  });

  testWidgets('entering a description and losing focus saves and retains the text', (tester) async {
    final asset = owned();
    when(() => mockActionService.updateDescription(asset.id, 'New description')).thenAnswer((_) async => true);

    late WidgetRef testRef;

    await tester.pumpTestWidget(
      context,
      Consumer(
        builder: (widgetContext, ref, _) {
          testRef = ref;
          return Column(
            children: [
              SheetAssetDescription(
                asset: asset,
                exifInfo: const ExifInfo(description: 'Old description'),
              ),
              ElevatedButton(key: const Key('other_target'), onPressed: () {}, child: const Text('Other')),
            ],
          );
        },
      ),
      overrides: [
        actionServiceProvider.overrideWithValue(mockActionService),
        foregroundUploadServiceProvider.overrideWithValue(context.service.upload),
      ],
    );

    testRef.read(assetViewerProvider.notifier).setAsset(asset);
    await tester.pump();

    final textFieldFinder = find.byType(TextField);
    expect(textFieldFinder, findsOneWidget);

    await tester.tap(textFieldFinder);
    await tester.pump();

    await tester.enterText(textFieldFinder, 'New description');
    await tester.pump();

    // Tap outside button to lose focus from textfield
    await tester.tap(find.byKey(const Key('other_target')));
    await tester.pumpAndSettle();

    verify(() => mockActionService.updateDescription(asset.id, 'New description')).called(1);

    // Ensure the new description remains displayed and did not revert
    expect(find.text('New description'), findsOneWidget);
  });

  testWidgets('does not call updateDescription if text is unchanged', (tester) async {
    final asset = owned();
    await pumpDescription(
      tester,
      asset: asset,
      exifInfo: const ExifInfo(description: 'Same description'),
      extraChild: ElevatedButton(key: const Key('other_target'), onPressed: () {}, child: const Text('Other')),
    );

    // Tap into text field and then tap away without changing text
    await tester.tap(find.byType(TextField));
    await tester.pump();

    await tester.tap(find.byKey(const Key('other_target')));
    await tester.pumpAndSettle();

    verifyNever(() => mockActionService.updateDescription(any(), any()));
  });

  testWidgets('reverts text if saving description fails', (tester) async {
    final asset = owned();
    when(() => mockActionService.updateDescription(asset.id, 'Failing description')).thenAnswer((_) async => false);

    late WidgetRef testRef;

    await tester.pumpTestWidget(
      context,
      Consumer(
        builder: (widgetContext, ref, _) {
          testRef = ref;
          return Column(
            children: [
              SheetAssetDescription(
                asset: asset,
                exifInfo: const ExifInfo(description: 'Original description'),
              ),
              ElevatedButton(key: const Key('other_target'), onPressed: () {}, child: const Text('Other')),
            ],
          );
        },
      ),
      overrides: [
        actionServiceProvider.overrideWithValue(mockActionService),
        foregroundUploadServiceProvider.overrideWithValue(context.service.upload),
      ],
    );

    testRef.read(assetViewerProvider.notifier).setAsset(asset);
    await tester.pump();

    await tester.tap(find.byType(TextField));
    await tester.pump();

    await tester.enterText(find.byType(TextField), 'Failing description');
    await tester.pump();

    await tester.tap(find.byKey(const Key('other_target')));
    await tester.pump();
    await tester.pump(const Duration(seconds: 4));

    verify(() => mockActionService.updateDescription(asset.id, 'Failing description')).called(1);

    // Should revert back to original description
    expect(find.text('Original description'), findsOneWidget);
  });

  testWidgets('updates text when asset changes via didUpdateWidget', (tester) async {
    final asset1 = owned();
    final asset2 = other();

    await pumpDescription(
      tester,
      asset: asset1,
      exifInfo: const ExifInfo(description: 'Asset 1 description'),
    );

    expect(find.text('Asset 1 description'), findsOneWidget);

    await pumpDescription(
      tester,
      asset: asset2,
      exifInfo: const ExifInfo(description: 'Asset 2 description'),
    );

    expect(find.text('Asset 2 description'), findsOneWidget);
  });

  test('ActionNotifier.updateDescription invalidates assetExifProvider', () async {
    final asset = owned();
    when(() => mockActionService.updateDescription(asset.id, 'Updated description')).thenAnswer((_) async => true);

    int exifProviderCallCount = 0;

    final container = ProviderContainer(
      overrides: [
        ...context.overrides,
        actionServiceProvider.overrideWithValue(mockActionService),
        foregroundUploadServiceProvider.overrideWithValue(context.service.upload),
        assetExifProvider.overrideWith((ref, a) {
          exifProviderCallCount++;
          return null;
        }),
      ],
    );

    container.read(assetViewerProvider.notifier).setAsset(asset);

    // Read assetExifProvider initially
    container.read(assetExifProvider(asset));
    expect(exifProviderCallCount, 1);

    // Trigger updateDescription
    final result = await container
        .read(actionProvider.notifier)
        .updateDescription(ActionSource.viewer, 'Updated description');

    expect(result.success, isTrue);

    // Read assetExifProvider again after invalidation
    container.read(assetExifProvider(asset));
    expect(exifProviderCallCount, 2);

    container.dispose();
  });

  test('ActionNotifier.updateRating invalidates assetExifProvider', () async {
    final asset = owned();
    when(() => mockActionService.updateRating(asset.id, 4)).thenAnswer((_) async => true);

    int exifProviderCallCount = 0;

    final container = ProviderContainer(
      overrides: [
        ...context.overrides,
        actionServiceProvider.overrideWithValue(mockActionService),
        foregroundUploadServiceProvider.overrideWithValue(context.service.upload),
        assetExifProvider.overrideWith((ref, a) {
          exifProviderCallCount++;
          return null;
        }),
      ],
    );

    container.read(assetViewerProvider.notifier).setAsset(asset);

    // Read assetExifProvider initially
    container.read(assetExifProvider(asset));
    expect(exifProviderCallCount, 1);

    // Trigger updateRating
    final result = await container.read(actionProvider.notifier).updateRating(ActionSource.viewer, 4);

    expect(result.success, isTrue);

    // Read assetExifProvider again after invalidation
    container.read(assetExifProvider(asset));
    expect(exifProviderCallCount, 2);

    container.dispose();
  });
}
