import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_stack.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/bottom_bar.widget.dart';

class ViewerBottomAppBar extends ConsumerWidget {
  const ViewerBottomAppBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    double opacity = ref.watch(assetViewerProvider.select((state) => state.backgroundOpacity));
    final showControls = ref.watch(assetViewerProvider.select((s) => s.showingControls));

    if (!showControls) {
      opacity = 0.0;
    }

    return IgnorePointer(
      ignoring: opacity < 1.0,
      child: AnimatedOpacity(
        opacity: opacity,
        duration: Durations.short2,
        child: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [AssetStackRow(), ViewerBottomBar()],
        ),
      ),
    );
  }
}
