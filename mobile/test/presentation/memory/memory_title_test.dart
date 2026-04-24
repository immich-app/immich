import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/presentation/pages/drift_memory.page.dart' as drift_page;
import 'package:immich_mobile/presentation/widgets/memory/memory_lane.widget.dart' as memory_lane;

void main() {
  testWidgets('prefers server title and falls back gracefully when year is absent', (tester) async {
    late BuildContext context;
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (ctx) {
            context = ctx;
            return const SizedBox.shrink();
          },
        ),
      ),
    );

    final ruleMemory = DriftMemory(
      id: 'memory-rule-1',
      createdAt: DateTime(2026, 4, 23),
      updatedAt: DateTime(2026, 4, 23),
      ownerId: 'user-1',
      type: MemoryTypeEnum.rule,
      data: const MemoryData({
        'ruleId': 'birthday',
        'title': 'Happy birthday, Alice',
      }),
      isSaved: false,
      memoryAt: DateTime(2026, 4, 23),
      showAt: DateTime(2026, 4, 23),
      hideAt: DateTime(2026, 4, 23, 23, 59),
      assets: const [],
    );

    final unknownRuleMemory = DriftMemory(
      id: 'memory-rule-2',
      createdAt: DateTime(2026, 4, 23),
      updatedAt: DateTime(2026, 4, 23),
      ownerId: 'user-1',
      type: MemoryTypeEnum.rule,
      data: const MemoryData({'ruleId': 'recent_trip'}),
      isSaved: false,
      memoryAt: DateTime(2026, 4, 23),
      showAt: DateTime(2026, 4, 23),
      hideAt: DateTime(2026, 4, 23, 23, 59),
      assets: const [],
    );

    expect(memory_lane.getMemoryTitle(context, ruleMemory), 'Happy birthday, Alice');
    expect(drift_page.getMemoryTitle(context, unknownRuleMemory), isNotEmpty);
  });
}
