import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/memories/models/memory.dart';
import 'package:immich_mobile/modules/memories/ui/memory_card.dart';
import 'package:intl/intl.dart';

class MemoryPage extends HookConsumerWidget {
  final List<Memory> memories;
  final int memoryIndex;

  const MemoryPage({
    required this.memories,
    required this.memoryIndex,
    super.key,
  });
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final verticalPageController = usePageController(initialPage: memoryIndex);
    final currentMemory = useState(memories[memoryIndex]);
    const bgColor = Colors.black;

    onMemoryChanged(int otherIndex) {
      currentMemory.value = memories[otherIndex];
    }

    buildBottomInfo() {
      return Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  currentMemory.value.title,
                  style: TextStyle(
                    color: Colors.grey[400],
                    fontSize: 11.0,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  DateFormat.yMMMMd('en_US').format(
                    currentMemory.value.assets[0].fileCreatedAt,
                  ),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12.0,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.black,
      ),
      backgroundColor: bgColor,
      body: SafeArea(
        child: PageView.builder(
          scrollDirection: Axis.vertical,
          controller: verticalPageController,
          onPageChanged: onMemoryChanged,
          itemCount: memories.length,
          itemBuilder: (context, mIndex) {
            // Build horizontal page
            return PageView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: memories[mIndex].assets.length,
              itemBuilder: (context, index) {
                final asset = memories[mIndex].assets[index];
                return Container(
                  color: Colors.black,
                  child: Column(
                    children: [
                      Expanded(child: MemoryCard(asset: asset)),
                      buildBottomInfo(),
                    ],
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
