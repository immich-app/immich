import 'dart:async';
import 'dart:math' as math;

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/memories/models/memory.dart';
import 'package:immich_mobile/modules/memories/providers/memory_auto_play.provider.dart';
import 'package:immich_mobile/modules/memories/ui/memory_bottom_info.dart';
import 'package:immich_mobile/modules/memories/ui/memory_card.dart';
import 'package:immich_mobile/modules/memories/ui/memory_epilogue.dart';
import 'package:immich_mobile/modules/memories/ui/memory_progress_indicator.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';

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
    final currentMemory = useRef(memories[memoryIndex]);
    final currentAssetPage = useRef(0);
    final currentMemoryIndex = useState(memoryIndex);
    final memoryTimer = useRef<Timer?>(null);
    final memoryStopWatch = useRef<Stopwatch?>(null);
    const bgColor = Colors.black;
    final animationDuration = useRef(
      ref
          .read(appSettingsServiceProvider)
          .getSetting(AppSettingsEnum.memoryAutoPlayDuration),
    );

    /// The list of all of the asset page controllers
    final memoryAssetPageControllers =
        List.generate(memories.length, (i) => usePageController());

    /// The main vertically scrolling page controller with each list of memories
    final memoryPageController = usePageController(initialPage: memoryIndex);

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

      // Precache the asset
      await precacheImage(
        ImmichImage.imageProvider(
          asset: asset,
        ),
        context,
      );
    }

    // Precache the next page right away if we are on the first page
    if (currentAssetPage.value == 0) {
      Future.delayed(const Duration(milliseconds: 200))
          .then((_) => precacheAsset(1));
    }

    int getAutoPlayDuration() {
      final currentAsset = currentMemory.value.assets[currentAssetPage.value];
      return currentAsset.isImage
          ? animationDuration.value
          : math.max(
              currentAsset.durationInSeconds + 2,
              animationDuration.value,
            );
    }

    void resetTimer([int? remainingTime]) {
      final isEpiloguePage =
          (memoryPageController.page?.floor() ?? 0) >= memories.length;

      memoryTimer.value?.cancel();
      memoryStopWatch.value?.reset();
      if (isEpiloguePage) {
        memoryTimer.value = null;
        memoryStopWatch.value = null;
        return;
      }

      memoryTimer.value = Timer(
        Duration(
          seconds: remainingTime ?? getAutoPlayDuration(),
        ),
        () => toNextAsset(currentAssetPage.value),
      );
      if (ref.read(memoryAutoPlayProvider)) {
        memoryStopWatch.value = Stopwatch()..start();
      }
    }

    onAssetChanged(int otherIndex) async {
      HapticFeedback.selectionClick();
      currentAssetPage.value = otherIndex;
      // Wait for page change animation to finish
      await Future.delayed(const Duration(milliseconds: 400));
      precacheAsset(otherIndex + 1);
      WidgetsBinding.instance.addPostFrameCallback((_) => resetTimer());
    }

    ref.listen(memoryAutoPlayProvider, (_, value) {
      if (!value) {
        memoryTimer.value?.cancel();
        memoryStopWatch.value?.stop();
      } else {
        final elapsedSeconds = memoryStopWatch.value?.elapsed.inSeconds;
        final remaining = getAutoPlayDuration() - (elapsedSeconds ?? 0);
        WidgetsBinding.instance
            .addPostFrameCallback((_) => resetTimer(remaining));
      }
    });

    // The Page Controller that scrolls horizontally with all of the assets
    useEffect(
      () {
        // Memories is an immersive activity
        SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
        WidgetsBinding.instance.addPostFrameCallback((_) => resetTimer());
        return () {
          memoryTimer.value?.cancel();
          memoryStopWatch.value?.stop();
        };
      },
      [],
    );

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
          onPopInvoked: (_) =>
              // Remove immersive mode and go back to normal mode
              SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge),
          child: SafeArea(
            child: PageView.builder(
              physics: const BouncingScrollPhysics(
                parent: AlwaysScrollableScrollPhysics(),
              ),
              scrollDirection: Axis.vertical,
              controller: memoryPageController,
              onPageChanged: (pageNumber) {
                HapticFeedback.mediumImpact();
                currentAssetPage.value = 0;

                if (pageNumber < memories.length) {
                  currentMemoryIndex.value = pageNumber;
                  currentMemory.value = memories[pageNumber];
                  WidgetsBinding.instance
                      .addPostFrameCallback((_) => resetTimer());
                }
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
                          return MemoryProgressIndicator(
                            ticks: memories[mIndex].assets.length,
                            value: currentAssetPage.value,
                            animationDuration: getAutoPlayDuration(),
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
                                onTap: () => toNextAsset(index),
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
