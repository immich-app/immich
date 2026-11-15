import 'dart:async';

import 'package:flutter/cupertino.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/presentation/pages/memory.page.dart';
import 'package:mocktail/mocktail.dart';
import '../../service.mocks.dart';
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
    assets: [RemoteAssetFactory.create(), RemoteAssetFactory.create(), RemoteAssetFactory.create()],
  );

  Future<void> pumpPage(WidgetTester tester, List<Memory> memories) =>
      tester.pumpTestWidget(context, MemoryPage(memories: memories, memoryIndex: 0), expectSettle: false);

  group('MemoryPage', () {
    testWidgets('Ignore repeated clicks during the animation triggered by clicking, '
        'and allow page flipping to continue after the end', (tester) async {
      final Memory memory = newMemory(type: MemoryTypeEnum.onThisDay, memoryAt: DateTime(2025, 10, 7));
      final MockAssetService assetService = context.service.asset.service;
      when(() => assetService.watchAsset(memory.assets[0])).thenAnswer((_) => const Stream<BaseAsset?>.empty());
      when(() => assetService.watchAsset(memory.assets[1])).thenAnswer((_) => const Stream<BaseAsset?>.empty());
      when(() => assetService.watchAsset(memory.assets[2])).thenAnswer((_) => const Stream<BaseAsset?>.empty());

      await pumpPage(tester, [memory]);

      await tester.pump();
      await tester.tapAt(const Offset(760.0, 500.0));
      await tester.pump();

      await tester.pump(const Duration(milliseconds: 200));
      await tester.tapAt(const Offset(760.0, 500.0));
      await tester.pumpAndSettle();

      final finder = find.byWidgetPredicate(
        (widget) => widget is PageView && widget.scrollDirection == Axis.horizontal,
      );

      final pageView = tester.widget<PageView>(finder);
      final controller = pageView.controller!;

      expect(controller.page, 1);

      // normal process
      await tester.pump();
      await tester.tapAt(const Offset(760.0, 500.0));
      await tester.pumpAndSettle();

      expect(controller.page, 2);

      await tester.pump(const Duration(milliseconds: 2000));
    });
  });
}
