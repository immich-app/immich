import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/memories/models/memory.dart';
import 'package:immich_mobile/modules/memories/ui/memory_card.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';
import 'package:intl/intl.dart';
import 'package:openapi/api.dart' as api;

@RoutePage()
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
      if (currentAssetIndex + 1 < currentMemory.value.assets.length) {
        // Go to the next asset
        memoryAssetPageController.nextPage(
          curve: Curves.easeInOut,
          duration: const Duration(milliseconds: 500),
        );
      } else {
        // Go to the next memory since we are at the end of our assets
        toNextMemory();
      }
    }

    updateProgressText() {
      assetProgress.value =
          "${currentAssetPage.value + 1}|${currentMemory.value.assets.length}";
    }

    /// Downloads and caches the image for the asset at this [currentMemory]'s index
    precacheAsset(int index) async {
      // Guard index out of range
      if (index < 0) {
        return;
      }

      // Context might be removed due to popping out of Memory Lane during Scroll handling
      if (!context.mounted) {
        return;
      }

      late Asset asset;
      if (index < currentMemory.value.assets.length) {
        // Uses the next asset in this current memory
        asset = currentMemory.value.assets[index];
      } else {
        // Precache the first asset in the next memory if available
        final currentMemoryIndex = memories.indexOf(currentMemory.value);

        // Guard no memory found
        if (currentMemoryIndex == -1) {
          return;
        }

        final nextMemoryIndex = currentMemoryIndex + 1;
        // Guard no next memory
        if (nextMemoryIndex >= memories.length) {
          return;
        }

        // Get the first asset from the next memory
        asset = memories[nextMemoryIndex].assets.first;
      }

      // Gets the thumbnail url and precaches it
      final precaches = <Future<dynamic>>[];

      precaches.add(
        ImmichImage.precacheAsset(
          asset,
          context,
          type: api.ThumbnailFormat.WEBP,
          size: 2048,
        ),
      );
      precaches.add(
        ImmichImage.precacheAsset(
          asset,
          context,
          type: api.ThumbnailFormat.JPEG,
          size: 2048,
        ),
      );

      await Future.wait(precaches);
    }

    // Precache the next page right away if we are on the first page
    if (currentAssetPage.value == 0) {
      Future.delayed(const Duration(milliseconds: 200))
          .then((_) => precacheAsset(1));
    }

    onAssetChanged(int otherIndex) {
      HapticFeedback.selectionClick();
      currentAssetPage.value = otherIndex;
      precacheAsset(otherIndex + 1);
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
                    fontSize: 13.0,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  DateFormat.yMMMMd().format(
                    memory.assets[0].fileCreatedAt,
                  ),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15.0,
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
        // Calculate OverScroll manually using the number of pixels away from maxScrollExtent
        // maxScrollExtend contains the sum of horizontal pixels of all assets for depth = 1
        // or sum of vertical pixels of all memories for depth = 0
        if (notification is ScrollUpdateNotification) {
          final offset = notification.metrics.pixels;
          final isLastMemory =
              (memories.indexOf(currentMemory.value) + 1) >= memories.length;
          if (isLastMemory) {
            // Vertical scroll handling only at the last asset.
            // Tapping on the last asset instead of swiping will trigger the scroll
            // implicitly which will trigger the below handling and thereby closes the
            // memory lane as well
            if (notification.depth == 0) {
              final isLastAsset = (currentAssetPage.value + 1) ==
                  currentMemory.value.assets.length;
              if (isLastAsset &&
                  (offset > notification.metrics.maxScrollExtent + 150)) {
                context.popRoute();
                return true;
              }
            }
            // Horizontal scroll handling
            if (notification.depth == 1 &&
                (offset > notification.metrics.maxScrollExtent + 100)) {
              context.popRoute();
              return true;
            }
          }
        }

        if (notification.depth == 0) {
          if (notification is ScrollStartNotification) {
            assetProgress.value = "";
            return true;
          }
          var currentPageNumber = memoryPageController.page!.toInt();
          currentMemory.value = memories[currentPageNumber];
          if (notification is ScrollEndNotification) {
            HapticFeedback.mediumImpact();
            if (currentPageNumber != previousMemoryIndex.value) {
              currentAssetPage.value = 0;
              previousMemoryIndex.value = currentPageNumber;
            }
            updateProgressText();
            return true;
          }
        }
        return false;
      },
      child: Scaffold(
        backgroundColor: bgColor,
        body: SafeArea(
          child: PageView.builder(
            physics: const BouncingScrollPhysics(
              parent: AlwaysScrollableScrollPhysics(),
            ),
            scrollDirection: Axis.vertical,
            controller: memoryPageController,
            itemCount: memories.length,
            itemBuilder: (context, mIndex) {
              // Build horizontal page
              return Column(
                children: [
                  Expanded(
                    child: PageView.builder(
                      physics: const BouncingScrollPhysics(
                        parent: AlwaysScrollableScrollPhysics(),
                      ),
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
                            onClose: () => context.popRoute(),
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
