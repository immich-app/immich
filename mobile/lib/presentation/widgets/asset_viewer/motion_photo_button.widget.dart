import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/providers/asset_viewer/is_motion_video_playing.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';

class MotionPhotoPlayButton extends ConsumerWidget {
  const MotionPhotoPlayButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetNotifier);
    final isPlaying = ref.watch(isPlayingMotionVideoProvider);
    final showControls = ref.watch(assetViewerProvider.select((state) => state.showingControls));
    final isShowingSheet = ref.watch(assetViewerProvider.select((state) => state.showingBottomSheet));

    if (asset == null || !asset.isMotionPhoto || isShowingSheet) {
      return const SizedBox.shrink();
    }

    return IgnorePointer(
      ignoring: !showControls,
      child: AnimatedOpacity(
        opacity: showControls ? 1.0 : 0.0,
        duration: Durations.short2,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.only(top: 60),
            child: Center(
              child: _MotionButton(
                isPlaying: isPlaying,
                onPressed: ref.read(isPlayingMotionVideoProvider.notifier).toggle,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _MotionButton extends StatelessWidget {
  final bool isPlaying;
  final VoidCallback onPressed;

  const _MotionButton({required this.isPlaying, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.grey[800]!.withValues(alpha: 0.4),
      borderRadius: const BorderRadius.all(Radius.circular(24)),
      child: InkWell(
        onTap: onPressed,
        borderRadius: const BorderRadius.all(Radius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isPlaying ? Icons.motion_photos_pause_outlined : Icons.play_circle_outline_rounded,
                color: Colors.white,
                size: 16,
              ),
              const SizedBox(width: 8),
              Text(
                CurrentPlatform.isAndroid ? 'motion'.t(context: context) : 'live'.t(context: context),
                style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
