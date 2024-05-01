@Tags(['widget'])

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:immich_mobile/modules/activities/widgets/activity_tile.dart';
import 'package:immich_mobile/modules/activities/widgets/dismissible_activity.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/current_asset.provider.dart';
import 'package:immich_mobile/shared/ui/confirm_dialog.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../fixtures/user.stub.dart';
import '../../test_utils.dart';
import '../../widget_tester_extensions.dart';
import '../asset_viewer/asset_viewer_mocks.dart';

final activity = Activity(
  id: '1',
  createdAt: DateTime(100),
  type: ActivityType.like,
  user: UserStub.admin,
);

void main() {
  late MockCurrentAssetProvider assetProvider;
  late List<Override> overrides;

  setUpAll(() => TestUtils.init());

  setUp(() {
    assetProvider = MockCurrentAssetProvider();
    overrides = [currentAssetProvider.overrideWith(() => assetProvider)];
  });

  testWidgets('Returns a Dismissible', (tester) async {
    await tester.pumpConsumerWidget(
      DismissibleActivity('1', ActivityTile(activity)),
      overrides: overrides,
    );

    expect(find.byType(Dismissible), findsOneWidget);
  });

  testWidgets('Dialog displayed when onDismiss is set', (tester) async {
    await tester.pumpConsumerWidget(
      DismissibleActivity('1', ActivityTile(activity), onDismiss: (_) {}),
      overrides: overrides,
    );

    final dismissible = find.byType(Dismissible);
    await tester.drag(dismissible, const Offset(500, 0));
    await tester.pumpAndSettle();

    expect(find.byType(ConfirmDialog), findsOneWidget);
  });

  testWidgets(
      'Ok action in ConfirmDialog should call onDismiss with activityId',
      (tester) async {
    String? receivedActivityId;
    await tester.pumpConsumerWidget(
      DismissibleActivity(
        '1',
        ActivityTile(activity),
        onDismiss: (id) => receivedActivityId = id,
      ),
      overrides: overrides,
    );

    final dismissible = find.byType(Dismissible);
    await tester.drag(dismissible, const Offset(-500, 0));
    await tester.pumpAndSettle();

    final okButton = find.text('delete_dialog_ok');
    await tester.tap(okButton);
    await tester.pumpAndSettle();

    expect(receivedActivityId, '1');
  });

  testWidgets('Delete icon for background if onDismiss is set', (tester) async {
    await tester.pumpConsumerWidget(
      DismissibleActivity('1', ActivityTile(activity), onDismiss: (_) {}),
      overrides: overrides,
    );

    final dismissible = find.byType(Dismissible);
    await tester.drag(dismissible, const Offset(500, 0));
    await tester.pumpAndSettle();

    expect(find.byIcon(Icons.delete_sweep_rounded), findsOneWidget);
  });

  testWidgets('No delete dialog if onDismiss is not set', (tester) async {
    await tester.pumpConsumerWidget(
      DismissibleActivity('1', ActivityTile(activity)),
      overrides: overrides,
    );

    final dismissible = find.byType(Dismissible);
    await tester.drag(dismissible, const Offset(500, 0));
    await tester.pumpAndSettle();

    expect(find.byType(ConfirmDialog), findsNothing);
  });

  testWidgets('No icon for background if onDismiss is not set', (tester) async {
    await tester.pumpConsumerWidget(
      DismissibleActivity('1', ActivityTile(activity)),
      overrides: overrides,
    );

    final dismissible = find.byType(Dismissible);
    await tester.drag(dismissible, const Offset(-500, 0));
    await tester.pumpAndSettle();

    expect(find.byIcon(Icons.delete_sweep_rounded), findsNothing);
  });
}
