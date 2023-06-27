import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
    final memoryPageController = usePageController(initialPage: memoryIndex);
    final memoryAssetPageController = usePageController();
    final currentMemory = useState(memories[memoryIndex]);
    final currentAssetPage = useState(0);
    final assetProgress = useState(
      "${currentAssetPage.value + 1}|${currentMemory.value.assets.length}",
    );
    const bgColor = Colors.black;

    toNextMemory() {
      memoryPageController.nextPage(
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeIn,
      );
    }

    toNextAsset(int currentAssetIndex) {
      (currentAssetIndex + 1 < currentMemory.value.assets.length)
          ? memoryAssetPageController.jumpToPage(
              (currentAssetIndex + 1),
            )
          : toNextMemory();
    }

    updateProgressText() {
      assetProgress.value =
          "${currentAssetPage.value + 1}|${currentMemory.value.assets.length}";
    }

    onMemoryChanged(int otherIndex) {
      HapticFeedback.mediumImpact();
      currentMemory.value = memories[otherIndex];
      currentAssetPage.value = 0;
      updateProgressText();
    }

    onAssetChanged(int otherIndex) {
      HapticFeedback.selectionClick();

      currentAssetPage.value = otherIndex;
      updateProgressText();
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
                  DateFormat.yMMMMd().format(
                    currentMemory.value.assets[0].fileCreatedAt,
                  ),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14.0,
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
      backgroundColor: bgColor,
      body: SafeArea(
        child: PageView.builder(
          scrollDirection: Axis.vertical,
          controller: memoryPageController,
          onPageChanged: onMemoryChanged,
          itemCount: memories.length,
          itemBuilder: (context, mIndex) {
            // Build horizontal page
            return Column(
              children: [
                Expanded(
                  child: PageView.builder(
                    controller: memoryAssetPageController,
                    onPageChanged: onAssetChanged,
                    scrollDirection: Axis.horizontal,
                    itemCount: memories[mIndex].assets.length,
                    itemBuilder: (context, index) {
                      final asset = memories[mIndex].assets[index];
                      return Container(
                        color: Colors.black,
                        child: MemoryCard(
                          asset: asset,
                          onTap: () => toNextAsset(index),
                          onClose: () => AutoRouter.of(context).pop(),
                          rightCornerText: assetProgress.value,
                          title: memories[mIndex].title,
                          showTitle: index == 0,
                        ),
                      );
                    },
                  ),
                ),
                buildBottomInfo(),
              ],
            );
          },
        ),
      ),
    );
  }
}
