import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/panorama.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class Panorama360Button extends ConsumerWidget {
  const Panorama360Button({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(assetViewerProvider.select((s) => s.currentAsset));
    if (asset == null || !asset.isImage) {
      return const SizedBox.shrink();
    }

    final showingDetails = ref.watch(assetViewerProvider.select((s) => s.showingDetails));
    if (showingDetails) {
      return const SizedBox.shrink();
    }

    final showControls = ref.watch(assetViewerProvider.select((s) => s.showingControls));

    final isPanoramaAsync = ref.watch(isPanoramaProvider(asset));
    final isPanorama = isPanoramaAsync.valueOrNull ?? false;
    if (!isPanorama) {
      return const SizedBox.shrink();
    }

    return IgnorePointer(
      ignoring: !showControls,
      child: AnimatedOpacity(
        opacity: showControls ? 1.0 : 0.0,
        duration: Durations.short2,
        child: SafeArea(
          child: Align(
            alignment: Alignment.bottomLeft,
            child: Padding(
              // Sits above the bottom app bar.
              padding: const EdgeInsets.only(left: 16, bottom: 88),
              child: _PanoramaChip(
                onTap: () => context.pushRoute(PanoramaViewerRoute(asset: asset)),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PanoramaChip extends StatelessWidget {
  final VoidCallback onTap;

  const _PanoramaChip({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.grey[900]!.withValues(alpha: 0.55),
      borderRadius: const BorderRadius.all(Radius.circular(24)),
      child: InkWell(
        onTap: onTap,
        borderRadius: const BorderRadius.all(Radius.circular(24)),
        child: const Padding(
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.threesixty, color: Colors.white, size: 18),
              SizedBox(width: 6),
              Text(
                '360°',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
