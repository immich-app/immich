import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/activity_statistics.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';

class OpenActivityActionButton extends ConsumerWidget {
  const OpenActivityActionButton({super.key, this.iconOnly = false, this.menuItem = false});

  final bool iconOnly;
  final bool menuItem;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final album = ref.watch(currentRemoteAlbumProvider);
    final asset = ref.watch(currentAssetNotifier) as RemoteAsset?;
    final count = album != null && album.id.isNotEmpty ? ref.watch(activityStatisticsProvider(album.id, asset?.id)) : 0;

    return BaseActionButton(
      iconData: Icons.chat_outlined,
      label: "activity_count".t(args: {"count": count}),
      onPressed: () => EventStream.shared.emit(const ViewerOpenBottomSheetEvent(activitiesMode: true)),
      iconOnly: iconOnly,
      menuItem: menuItem,
    );
  }
}
