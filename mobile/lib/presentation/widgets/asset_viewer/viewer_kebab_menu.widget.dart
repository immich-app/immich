import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/utils/action_button.utils.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';

class ViewerKebabMenu extends ConsumerWidget {
  const ViewerKebabMenu({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetNotifier);
    if (asset == null) {
      return const SizedBox.shrink();
    }

    final isTrashEnable = ref.watch(serverInfoProvider.select((state) => state.serverFeatures.trash));
    final isOwner = asset is RemoteAsset && asset.ownerId == ref.watch(currentUserProvider)?.id;
    final isInLockedView = ref.watch(inLockedViewProvider);
    final currentAlbum = ref.watch(currentRemoteAlbumProvider);
    final isArchived = asset is RemoteAsset && asset.visibility == AssetVisibility.archive;
    final advancedTroubleshooting = ref.watch(settingsProvider.notifier).get(Setting.advancedTroubleshooting);

    final buttonContext = ActionButtonContext(
      asset: asset,
      isOwner: isOwner,
      isArchived: isArchived,
      isTrashEnabled: isTrashEnable,
      isInLockedView: isInLockedView,
      isStacked: asset is RemoteAsset && asset.stackId != null,
      currentAlbum: currentAlbum,
      advancedTroubleshooting: advancedTroubleshooting,
      source: ActionSource.viewer,
    );

    final theme = context.themeData;
    final menuChildren = <Widget>[
      BaseActionButton(
        label: 'open_bottom_sheet_about'.t(context: context),
        iconData: Icons.info_outline,
        onPressed: () => EventStream.shared.emit(const ViewerOpenBottomSheetEvent()),
      ),
    ];

    final actions = ActionButtonBuilder.build(
      buttonContext,
      actionTypes: ActionButtonBuilder.kebabMenuActionTypes,
    ).map((w) => w.build(context, ref)).expand((action) => [const Divider(height: 0), action]).toList(growable: false);

    if (actions.isNotEmpty) {
      menuChildren.addAll(actions);
    }

    return MenuAnchor(
      style: MenuStyle(
        backgroundColor: WidgetStatePropertyAll(theme.scaffoldBackgroundColor),
        elevation: const WidgetStatePropertyAll(4),
        shape: WidgetStatePropertyAll(RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
        padding: const WidgetStatePropertyAll(EdgeInsets.symmetric(vertical: 2)),
      ),
      menuChildren: menuChildren,
      builder: (context, controller, child) {
        return IconButton(
          icon: const Icon(Icons.more_vert_rounded),
          onPressed: () {
            if (controller.isOpen) {
              controller.close();
            } else {
              controller.open();
            }
          },
        );
      },
    );
  }
}
