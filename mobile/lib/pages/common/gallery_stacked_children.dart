import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_stack.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/show_controls.provider.dart';
import 'package:immich_mobile/providers/image/immich_remote_image_provider.dart';

class GalleryStackedChildren extends HookConsumerWidget {
  final ValueNotifier<int> stackIndex;

  const GalleryStackedChildren(this.stackIndex, {super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetProvider);
    if (asset == null) {
      return const SizedBox();
    }

    final stackId = asset.stackId;
    if (stackId == null) {
      return const SizedBox();
    }

    final stackElements = ref.watch(assetStackStateProvider(stackId));
    if (stackElements.length > 1) {
      final firstElement = stackElements.first;
      //This is to make sure that the primary element is always the first one
      //It ensures consistency with the web version of the app where the primary element is always the first one
      final restElements = stackElements.sublist(1);
      restElements.sort((a, b) => a.fileCreatedAt.compareTo(b.fileCreatedAt));
      stackElements
        ..clear()
        ..add(firstElement)
        ..addAll(restElements);
    }
    final showControls = ref.watch(showControlsProvider);

    return IgnorePointer(
      ignoring: !showControls,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 100),
        opacity: showControls ? 1.0 : 0.0,
        child: SizedBox(
          height: 80,
          child: ListView.builder(
            shrinkWrap: true,
            scrollDirection: Axis.horizontal,
            itemCount: stackElements.length,
            padding: const EdgeInsets.only(
              left: 5,
              right: 5,
              bottom: 30,
            ),
            itemBuilder: (context, index) {
              final currentAsset = stackElements.elementAt(index);
              final assetId = currentAsset.remoteId;
              if (assetId == null) {
                return const SizedBox();
              }

              return Padding(
                key: ValueKey(currentAsset.id),
                padding: const EdgeInsets.only(right: 5),
                child: GestureDetector(
                  onTap: () {
                    stackIndex.value = index;
                    ref.read(currentAssetProvider.notifier).set(currentAsset);
                  },
                  child: Container(
                    width: 60,
                    height: 60,
                    decoration: index == stackIndex.value
                        ? const BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.all(Radius.circular(6)),
                            border: Border.fromBorderSide(
                              BorderSide(color: Colors.white, width: 2),
                            ),
                          )
                        : const BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.all(Radius.circular(6)),
                            border: null,
                          ),
                    child: ClipRRect(
                      borderRadius: const BorderRadius.all(Radius.circular(4)),
                      child: Image(
                        fit: BoxFit.cover,
                        image: ImmichRemoteImageProvider(assetId: assetId),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
