import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/memories/models/memory.dart';
import 'package:immich_mobile/modules/memories/ui/memory_bottom_info.dart';
import 'package:immich_mobile/modules/memories/ui/memory_card.dart';
import 'package:immich_mobile/modules/memories/ui/memory_epilogue.dart';
import 'package:immich_mobile/modules/memories/ui/memory_progress_indicator.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';
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
    final currentMemory = useState(memories[memoryIndex]);
    final currentAssetPage = useState(0);
    final currentMemoryIndex = useState(memoryIndex);
    final assetProgress = useState(
      "${currentAssetPage.value + 1}|${currentMemory.value.assets.length}",
    );
    const bgColor = Colors.black;

    /// The list of all of the asset page controllers
    final memoryAssetPageControllers =
        List.generate(memories.length, (i) => usePageController());

    /// The main vertically scrolling page controller with each list of memories
    final memoryPageController = usePageController(initialPage: memoryIndex);

    // The Page Controller that scrolls horizontally with all of the assets
    useEffect(() {
      // Memories is an immersive activity
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
      return null;
    });

    toNextMemory() {
      memoryPageController.nextPage(
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeIn,
      );
    }

    toNextAsset(int currentAssetIndex) {
      if (currentAssetIndex + 1 < currentMemory.value.assets.length) {
        // Go to the next asset
        PageController controller =
            memoryAssetPageControllers[currentMemoryIndex.value];

        controller.nextPage(
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
          final isEpiloguePage =
              (memoryPageController.page?.floor() ?? 0) >= memories.length;

          final offset = notification.metrics.pixels;
          if (isEpiloguePage &&
              (offset > notification.metrics.maxScrollExtent + 150)) {
            context.popRoute();
            return true;
          }
        }

        return false;
      },
      child: Scaffold(
        backgroundColor: bgColor,
        body: PopScope(
          onPopInvoked: (didPop) {
            // Remove immersive mode and go back to normal mode
            SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
          },
          child: SafeArea(
            child: PageView.builder(
              physics: const BouncingScrollPhysics(
                parent: AlwaysScrollableScrollPhysics(),
              ),
              scrollDirection: Axis.vertical,
              controller: memoryPageController,
              onPageChanged: (pageNumber) {
                HapticFeedback.mediumImpact();
                if (pageNumber < memories.length) {
                  currentMemoryIndex.value = pageNumber;
                  currentMemory.value = memories[pageNumber];
                }

                currentAssetPage.value = 0;

                updateProgressText();
              },
              itemCount: memories.length + 1,
              itemBuilder: (context, mIndex) {
                // Build last page
                if (mIndex == memories.length) {
                  return MemoryEpilogue(
                    onStartOver: () => memoryPageController.animateToPage(
                      0,
                      duration: const Duration(seconds: 1),
                      curve: Curves.easeInOut,
                    ),
                  );
                }
                // Build horizontal page
                final assetController = memoryAssetPageControllers[mIndex];
                return Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(
                        left: 24.0,
                        right: 24.0,
                        top: 8.0,
                        bottom: 2.0,
                      ),
                      child: AnimatedBuilder(
                        animation: assetController,
                        builder: (context, child) {
                          double value = 0.0;
                          if (assetController.hasClients) {
                            // We can only access [page] if this has clients
                            value = assetController.page ?? 0;
                          }
                          return MemoryProgressIndicator(
                            ticks: memories[mIndex].assets.length,
                            value: (value + 1) / memories[mIndex].assets.length,
                          );
                        },
                      ),
                    ),
                    Expanded(
                      child: Stack(
                        children: [
                          PageView.builder(
                            physics: const BouncingScrollPhysics(
                              parent: AlwaysScrollableScrollPhysics(),
                            ),
                            controller: assetController,
                            onPageChanged: onAssetChanged,
                            scrollDirection: Axis.horizontal,
                            itemCount: memories[mIndex].assets.length,
                            itemBuilder: (context, index) {
                              final asset = memories[mIndex].assets[index];
                              return GestureDetector(
                                behavior: HitTestBehavior.translucent,
                                onTap: () {
                                  toNextAsset(index);
                                },
                                child: Container(
                                  color: Colors.black,
                                  child: MemoryCard(
                                    asset: asset,
                                    title: memories[mIndex].title,
                                    showTitle: index == 0,
                                  ),
                                ),
                              );
                            },
                          ),
                          Positioned(
                            top: 8,
                            left: 8,
                            child: MaterialButton(
                              minWidth: 0,
                              onPressed: () {
                                // auto_route doesn't invoke pop scope, so
                                // turn off full screen mode here
                                // https://github.com/Milad-Akarie/auto_route_library/issues/1799
                                context.popRoute();
                                SystemChrome.setEnabledSystemUIMode(
                                  SystemUiMode.edgeToEdge,
                                );
                              },
                              shape: const CircleBorder(),
                              color: Colors.white.withOpacity(0.2),
                              elevation: 0,
                              child: const Icon(
                                Icons.close_rounded,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    MemoryBottomInfo(memory: memories[mIndex]),
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}
