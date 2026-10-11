import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/presentation/pages/memory_list.page.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:intl/intl.dart';

import '../factories/remote_asset_factory.dart';
import 'presentation_context.dart';

void main() {
  late PresentationContext context;

  setUp(() async => context = await PresentationContext.create());
  tearDown(() async => await context.dispose());

  Memory newMemory({required MemoryTypeEnum type, required DateTime memoryAt, String? personName}) => Memory(
    id: 'memory-${memoryAt.toIso8601String()}',
    createdAt: DateTime(2026),
    updatedAt: DateTime(2026),
    ownerId: 'user-1',
    type: type,
    data: MemoryData(year: memoryAt.year, personName: personName),
    isSaved: false,
    memoryAt: memoryAt,
    assets: [RemoteAssetFactory.create()],
  );

  Future<void> pumpPage(WidgetTester tester, List<Memory> memories) => tester.pumpTestWidget(
    context,
    const MemoryListPage(),
    overrides: [allMemoriesProvider(false).overrideWith((ref) => memories)],
    expectSettle: false,
  );

  group('MemoryListPage', () {
    testWidgets('shows the date of each on this day memory', (tester) async {
      await pumpPage(tester, [
        newMemory(type: MemoryTypeEnum.onThisDay, memoryAt: DateTime(2025, 10, 7)),
        newMemory(type: MemoryTypeEnum.onThisDay, memoryAt: DateTime(2025, 10, 6)),
      ]);
      await tester.pump();

      expect(find.text('October 7, 2025'), findsOneWidget);
      expect(find.text('October 6, 2025'), findsOneWidget);
      expect(find.textContaining('ago'), findsNothing);
    });

    testWidgets('shows the date when intl has no date formats for the app language', (tester) async {
      Intl.defaultLocale = 'kab';
      addTearDown(() => Intl.defaultLocale = null);
      await pumpPage(tester, [newMemory(type: MemoryTypeEnum.onThisDay, memoryAt: DateTime(2025, 10, 7))]);
      await tester.pump();

      expect(find.text('October 7, 2025'), findsOneWidget);
    });

    testWidgets('shows the person name for a birthday memory', (tester) async {
      await pumpPage(tester, [
        newMemory(type: MemoryTypeEnum.birthday, memoryAt: DateTime(2025, 10, 7), personName: 'Alice'),
      ]);
      await tester.pump();

      expect(find.text("Alice's birthday"), findsOneWidget);
      expect(find.text('October 7, 2025'), findsNothing);
    });
  });
}
