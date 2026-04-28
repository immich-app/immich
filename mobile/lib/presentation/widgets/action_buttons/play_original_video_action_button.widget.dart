import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/play_original_video_provider.dart';

class PlayOriginalVideoActionButton extends ConsumerWidget {
  const PlayOriginalVideoActionButton({super.key, required this.asset, this.iconOnly = false, this.menuItem = false});

  final BaseAsset asset;
  final bool iconOnly;
  final bool menuItem;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final playOriginalVideo = ref.watch(effectivePlayOriginalVideoProvider(asset.heroTag));

    return BaseActionButton(
      label: playOriginalVideo ? 'play_transcoded_video'.tr() : 'play_original_video'.tr(),
      iconData: Icons.video_file_outlined,
      iconOnly: iconOnly,
      menuItem: menuItem,
      onPressed: () => ref.read(playOriginalVideoOverrideProvider(asset.heroTag).notifier).state = !playOriginalVideo,
    );
  }
}
