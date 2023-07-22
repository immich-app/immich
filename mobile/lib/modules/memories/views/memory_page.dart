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
    final previousMemoryIndex = useState(memoryIndex);
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

    onAssetChanged(int otherIndex) {
      HapticFeedback.selectionClick();
      currentAssetPage.value = otherIndex;
      updateProgressText();
    }

    buildBottomInfo(Memory memory) {
      return Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  memory.title,
                  style: TextStyle(
                    color: Colors.grey[400],
                    fontSize: 11.0,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  DateFormat.yMMMMd().format(
                    memory.assets[0].fileCreatedAt,
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

    /* Notification listener is used instead of OnPageChanged callback since OnPageChanged is called
     * when the page in the **center** of the viewer changes. We want to reset currentAssetPage only when the final
     * page during the end of scroll is different than the current page
     */
    return NotificationListener<ScrollNotification>(
      onNotification: (ScrollNotification notification) {
        if (notification.depth == 0) {
          var currentPageNumber = memoryPageController.page!.toInt();
          currentMemory.value = memories[currentPageNumber];
          if (notification is ScrollStartNotification) {
            assetProgress.value = "";
          } else if (notification is ScrollEndNotification) {
            HapticFeedback.mediumImpact();
            if (currentPageNumber != previousMemoryIndex.value) {
              currentAssetPage.value = 0;
              previousMemoryIndex.value = currentPageNumber;
            }
            updateProgressText();
          }
        }
        return false;
      },
      child: Scaffold(
        backgroundColor: bgColor,
        body: SafeArea(
          child: PageView.builder(
            scrollDirection: Axis.vertical,
            controller: memoryPageController,
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
                  buildBottomInfo(memories[mIndex]),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}
