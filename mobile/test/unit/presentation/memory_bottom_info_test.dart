import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/presentation/widgets/memory/memory_bottom_info.widget.dart';

import '../factories/remote_asset_factory.dart';
import 'presentation_context.dart';

void main() {
  late PresentationContext context;

  setUp(() async => context = await PresentationContext.create());
  tearDown(() async => await context.dispose());

  RemoteAsset newAssetTakenIn(int year) =>
      RemoteAssetFactory.create().copyWith(createdAt: DateTime(year, 9, 28, 12).toUtc());

  Memory newBirthdayMemory(List<RemoteAsset> assets, {String personName = 'Katie'}) => Memory(
    id: 'memory-1',
    createdAt: DateTime(2026),
    updatedAt: DateTime(2026),
    ownerId: 'user-1',
    type: MemoryTypeEnum.birthday,
    data: MemoryData(year: 1995, personName: personName),
    isSaved: false,
    memoryAt: DateTime(2026),
    assets: assets,
  );

  group('MemoryBottomInfo', () {
    testWidgets('shows the age and date of the given asset', (tester) async {
      final first = newAssetTakenIn(2021);
      final current = newAssetTakenIn(2015);

      await tester.pumpTestWidget(
        context,
        MemoryBottomInfo(memory: newBirthdayMemory([first, current]), asset: current),
      );

      expect(find.text("Katie's birthday · 20 years old"), findsOneWidget);
      expect(find.text('September 28, 2015'), findsOneWidget);
      expect(find.text('September 28, 2021'), findsNothing);
    });

    testWidgets('wraps a long title instead of pushing the timeline button off screen', (tester) async {
      tester.view.physicalSize = const Size(360, 640);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      final asset = newAssetTakenIn(2015);
      final memory = newBirthdayMemory([asset], personName: 'Amelia Josephine Montgomery Vanderbilt');

      await tester.pumpTestWidget(context, MemoryBottomInfo(memory: memory, asset: asset));

      expect(tester.takeException(), isNull);
      expect(tester.getRect(find.byIcon(Icons.open_in_new)).right, lessThanOrEqualTo(360));
      expect(
        tester.getRect(find.textContaining('Amelia')).right,
        lessThanOrEqualTo(tester.getRect(find.byType(MaterialButton)).left),
      );
    });
  });
}
