import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_stack.provider.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';

class AssetStackRow extends ConsumerWidget {
  const AssetStackRow({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    int opacity = ref.watch(
      assetViewerProvider.select((state) => state.backgroundOpacity),
    );
    final showControls = ref.watch(assetViewerProvider.select((s) => s.showingControls));

    if (!showControls) {
      opacity = 0;
    }

    final asset = ref.watch(assetViewerProvider.select((s) => s.currentAsset));

    return IgnorePointer(
      ignoring: opacity < 255,
      child: AnimatedOpacity(
        opacity: opacity / 255,
        duration: Durations.short2,
        child: ref.watch(stackChildrenNotifier(asset)).when(
              data: (state) => SizedBox.square(
                dimension: 80,
                child: _StackList(stack: state),
              ),
              error: (_, __) => const SizedBox.shrink(),
              loading: () => const SizedBox.shrink(),
            ),
      ),
    );
  }
}

class _StackList extends ConsumerWidget {
  final List<RemoteAsset> stack;

  const _StackList({required this.stack});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.only(
        left: 5,
        right: 5,
        bottom: 30,
      ),
      itemCount: stack.length,
      itemBuilder: (ctx, index) {
        final asset = stack[index];
        return Padding(
          padding: const EdgeInsets.only(right: 5),
          child: GestureDetector(
            onTap: () {
              ref.read(assetViewerProvider.notifier).setStackIndex(index);
              ref.read(currentAssetNotifier.notifier).setAsset(asset);
            },
            child: Container(
              height: 60,
              width: 60,
              decoration: index == ref.watch(assetViewerProvider.select((s) => s.stackIndex))
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
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image(
                      fit: BoxFit.cover,
                      image: getThumbnailImageProvider(
                        remoteId: asset.id,
                        size: const Size.square(60),
                      ),
                    ),
                    if (asset.isVideo)
                      const Icon(
                        Icons.play_circle_outline_rounded,
                        color: Colors.white,
                        size: 16,
                        shadows: [
                          Shadow(
                            blurRadius: 5.0,
                            color: Color.fromRGBO(0, 0, 0, 0.6),
                            offset: Offset(0.0, 0.0),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
