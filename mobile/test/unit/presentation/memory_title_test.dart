import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/colors.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/widgets/memory/memory_title.widget.dart';

import '../factories/remote_asset_factory.dart';
import 'presentation_context.dart';

void main() {
  late PresentationContext context;

  setUp(() async => context = await PresentationContext.create());
  tearDown(() async => await context.dispose());

  Memory newMemory({required MemoryTypeEnum type, required int year, String? personName}) => Memory(
    id: 'memory-1',
    createdAt: DateTime(2026),
    updatedAt: DateTime(2026),
    ownerId: 'user-1',
    type: type,
    data: MemoryData(year: year, personName: personName),
    isSaved: false,
    memoryAt: DateTime(2026),
    assets: [],
  );

  Widget titleOf(Memory memory, {RemoteAsset? asset}) =>
      Builder(builder: (context) => Text(getMemoryTitle(context.t, memory, asset: asset)));

  RemoteAsset newAssetTakenIn(int year) =>
      RemoteAssetFactory.create().copyWith(createdAt: DateTime(year, 9, 28, 12).toUtc());

  group('getMemoryTitle', () {
    testWidgets('returns years ago for an on this day memory', (tester) async {
      final memory = newMemory(type: MemoryTypeEnum.onThisDay, year: DateTime.now().year - 3);

      await tester.pumpTestWidget(context, titleOf(memory));

      expect(find.text('3 years ago'), findsOneWidget);
    });

    testWidgets('returns the person name for a birthday memory', (tester) async {
      final memory = newMemory(type: MemoryTypeEnum.birthday, year: 1990, personName: 'Alice');

      await tester.pumpTestWidget(context, titleOf(memory));

      expect(find.text("Alice's birthday"), findsOneWidget);
    });

    testWidgets('returns unknown for a birthday memory without a person name', (tester) async {
      final memory = newMemory(type: MemoryTypeEnum.birthday, year: 1990);

      await tester.pumpTestWidget(context, titleOf(memory));

      expect(find.text('Unknown'), findsOneWidget);
    });

    for (final (age, expected) in [(1, "Alice's birthday · 1 year old"), (20, "Alice's birthday · 20 years old")]) {
      testWidgets('returns "$expected" for an asset taken at age $age', (tester) async {
        final memory = newMemory(type: MemoryTypeEnum.birthday, year: 1990, personName: 'Alice');

        await tester.pumpTestWidget(context, titleOf(memory, asset: newAssetTakenIn(1990 + age)));

        expect(find.text(expected), findsOneWidget);
      });
    }

    testWidgets('omits the age for an asset taken in the birth year', (tester) async {
      final memory = newMemory(type: MemoryTypeEnum.birthday, year: 1990, personName: 'Alice');

      await tester.pumpTestWidget(context, titleOf(memory, asset: newAssetTakenIn(1990)));

      expect(find.text("Alice's birthday"), findsOneWidget);
    });

    testWidgets('ignores the asset for an on this day memory', (tester) async {
      final memory = newMemory(type: MemoryTypeEnum.onThisDay, year: DateTime.now().year - 3);

      await tester.pumpTestWidget(context, titleOf(memory, asset: newAssetTakenIn(2015)));

      expect(find.text('3 years ago'), findsOneWidget);
    });
  });

  group('MemoryTitle', () {
    const style = TextStyle(color: Colors.white, fontSize: 16);

    testWidgets('renders plain text for an on this day memory', (tester) async {
      await tester.pumpTestWidget(
        context,
        const MemoryTitle(type: MemoryTypeEnum.onThisDay, title: '3 years ago', style: style),
      );

      expect(tester.widget<Text>(find.text('3 years ago')).style?.color, Colors.white);
      expect(find.byIcon(Icons.cake_rounded), findsNothing);
    });

    testWidgets('renders a cake icon and yellow badge for a birthday memory', (tester) async {
      await tester.pumpTestWidget(
        context,
        const MemoryTitle(type: MemoryTypeEnum.birthday, title: "Alice's birthday", style: style),
      );

      final badge = tester.widget<DecoratedBox>(
        find.ancestor(of: find.text("Alice's birthday"), matching: find.byType(DecoratedBox)).first,
      );
      expect((badge.decoration as BoxDecoration).color, immichLogoYellow);
      expect(tester.widget<Text>(find.text("Alice's birthday")).style?.color, Colors.black);
      expect(tester.widget<Icon>(find.byIcon(Icons.cake_rounded)).size, 20);
    });

    testWidgets('renders the cake icon above the birthday badge', (tester) async {
      await tester.pumpTestWidget(
        context,
        const MemoryTitle(type: MemoryTypeEnum.birthday, title: "Alice's birthday", style: style),
      );

      expect(
        tester.getBottomLeft(find.byIcon(Icons.cake_rounded)).dy,
        lessThanOrEqualTo(tester.getTopLeft(find.text("Alice's birthday")).dy),
      );
    });
  });
}
