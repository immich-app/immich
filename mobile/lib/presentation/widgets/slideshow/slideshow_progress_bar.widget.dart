import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_provider.dart';

/// Bar indicating current progress through a given slide's alloted display time
class SlideshowProgressBar extends ConsumerWidget {
  final BaseAsset asset;
  final Animation<double> progress;

  const SlideshowProgressBar({super.key, required this.asset, required this.progress});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = this.asset;

    if (asset.isImage) {
      return AnimatedBuilder(animation: progress, builder: (context, _) => _bar(context, progress.value));
    }

    final position = ref.watch(videoPlayerProvider(asset.id).select((s) => s.position));
    return _bar(context, position.inMilliseconds / asset.duration.inMilliseconds);
  }

  Widget _bar(BuildContext context, double value) {
    return LinearProgressIndicator(
      color: context.colorScheme.primary,
      borderRadius: BorderRadius.zero,
      minHeight: 5,
      value: value,
    );
  }
}
