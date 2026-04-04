import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/bottom_bar.widget.dart';

class ViewerBottomAppBar extends ConsumerWidget {
  const ViewerBottomAppBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final showingControls = ref.watch(assetViewerProvider.select((s) => s.showingControls));
    double opacity = ref.watch(assetViewerProvider.select((s) => s.backgroundOpacity)) * (showingControls ? 1 : 0);

    return IgnorePointer(
      ignoring: opacity < 1.0,
      child: AnimatedOpacity(opacity: opacity, duration: Durations.short2, child: const ViewerBottomBar()),
    );
  }
}
