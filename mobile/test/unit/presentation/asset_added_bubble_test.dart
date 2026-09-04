import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:immich_mobile/providers/activity_service.provider.dart';
import 'package:immich_mobile/widgets/activities/asset_added_bubble.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart' show AssetTypeEnum;

import '../../service.mocks.dart';
import '../factories/activity_factory.dart';
import '../factories/user_factory.dart';
import 'presentation_context.dart';

class FakeWidgetRef extends Fake implements WidgetRef {}

void main() {
  late PresentationContext context;
  late UserDto alice;

  setUpAll(() => registerFallbackValue(FakeWidgetRef()));

  setUp(() async {
    context = await PresentationContext.create();
    alice = UserFactory.createDto(name: 'alice');
  });
  tearDown(() => context.dispose());

  List<Activity> assetsAdded(List<AssetTypeEnum?> assetTypes, {String groupId = 'group-1'}) => assetTypes
      .map((assetType) => ActivityFactory.createAssetAdded(assetType: assetType, groupId: groupId, user: alice))
      .toList();

  group('AssetAddedBubble header', () {
    testWidgets('describes an image-only group as photos', (tester) async {
      await tester.pumpTestWidget(
        context,
        AssetAddedBubble(activities: assetsAdded([AssetTypeEnum.IMAGE, AssetTypeEnum.IMAGE])),
      );

      expect(find.text('alice added 2 photos'), findsOneWidget);
    });

    testWidgets('uses the singular form for a single asset', (tester) async {
      await tester.pumpTestWidget(context, AssetAddedBubble(activities: assetsAdded([AssetTypeEnum.IMAGE])));

      expect(find.text('alice added a photo'), findsOneWidget);
    });

    testWidgets('describes a video-only group as videos', (tester) async {
      await tester.pumpTestWidget(
        context,
        AssetAddedBubble(activities: assetsAdded([AssetTypeEnum.VIDEO, AssetTypeEnum.VIDEO])),
      );

      expect(find.text('alice added 2 videos'), findsOneWidget);
    });

    testWidgets('describes a mixed-media group as items', (tester) async {
      await tester.pumpTestWidget(
        context,
        AssetAddedBubble(activities: assetsAdded([AssetTypeEnum.IMAGE, AssetTypeEnum.VIDEO])),
      );

      expect(find.text('alice added 2 items'), findsOneWidget);
    });
  });

  group('AssetAddedBubble thumbnails', () {
    testWidgets('marks only video tiles with a play icon', (tester) async {
      await tester.pumpTestWidget(
        context,
        AssetAddedBubble(activities: assetsAdded([AssetTypeEnum.IMAGE, AssetTypeEnum.VIDEO, AssetTypeEnum.VIDEO])),
      );

      expect(find.byType(Image), findsNWidgets(3));
      expect(find.byIcon(Icons.play_circle_outline_rounded), findsNWidgets(2));
    });

    testWidgets('shows no play icon for an image-only group', (tester) async {
      await tester.pumpTestWidget(
        context,
        AssetAddedBubble(activities: assetsAdded([AssetTypeEnum.IMAGE, AssetTypeEnum.IMAGE])),
      );

      expect(find.byIcon(Icons.play_circle_outline_rounded), findsNothing);
    });

    testWidgets('collapses a large group behind a +N tile that expands on tap', (tester) async {
      final activities = assetsAdded(List.filled(12, AssetTypeEnum.IMAGE));

      await tester.pumpTestWidget(context, AssetAddedBubble(activities: activities));

      expect(find.byType(Image), findsNWidgets(10));
      expect(find.text('+3'), findsOneWidget);

      await tester.tap(find.text('+3'));
      await tester.pumpAndSettle();

      expect(find.byType(Image), findsNWidgets(12));
      expect(find.text('+3'), findsNothing);
    });

    testWidgets('shows all thumbnails without an overlay at exactly the limit', (tester) async {
      await tester.pumpTestWidget(
        context,
        AssetAddedBubble(activities: assetsAdded(List.filled(10, AssetTypeEnum.IMAGE))),
      );

      expect(find.byType(Image), findsNWidgets(10));
      expect(find.textContaining('+'), findsNothing);
    });

    testWidgets('opens the asset viewer for the tapped tile', (tester) async {
      final mockActivityService = MockActivityService();
      when(() => mockActivityService.buildAssetViewerRoute('asset-1', any())).thenAnswer((_) async => null);
      final activity = ActivityFactory.createAssetAdded(assetId: 'asset-1', user: alice);

      await tester.pumpTestWidget(
        context,
        AssetAddedBubble(activities: [activity]),
        overrides: [activityServiceProvider.overrideWith((ref) => mockActivityService)],
      );
      await tester.tap(find.byType(Image), warnIfMissed: false);
      await tester.pumpAndSettle();

      verify(() => mockActivityService.buildAssetViewerRoute('asset-1', any())).called(1);
    });
  });
}
