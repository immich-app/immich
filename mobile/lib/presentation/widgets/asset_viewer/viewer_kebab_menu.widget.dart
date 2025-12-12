import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/cast.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/utils/action_button.utils.dart';

class ViewerKebabMenu extends ConsumerWidget {
  const ViewerKebabMenu({super.key, this.originalTheme});

  final ThemeData? originalTheme;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetNotifier);
    if (asset == null) {
      return const SizedBox.shrink();
    }

    final user = ref.watch(currentUserProvider);
    final isOwner = asset is RemoteAsset && asset.ownerId == user?.id;
    final isCasting = ref.watch(castProvider.select((c) => c.isCasting));
    final timelineOrigin = ref.read(timelineServiceProvider).origin;
    final isTrashEnable = ref.watch(serverInfoProvider.select((state) => state.serverFeatures.trash));
    final isInLockedView = ref.watch(inLockedViewProvider);
    final currentAlbum = ref.watch(currentRemoteAlbumProvider);
    final isArchived = asset is RemoteAsset && asset.visibility == AssetVisibility.archive;
    final advancedTroubleshooting = ref.watch(settingsProvider.notifier).get(Setting.advancedTroubleshooting);

    final actionContext = ActionButtonContext(
      asset: asset,
      isOwner: isOwner,
      isArchived: isArchived,
      isTrashEnabled: isTrashEnable,
      isStacked: asset is RemoteAsset && asset.stackId != null,
      isInLockedView: isInLockedView,
      currentAlbum: currentAlbum,
      advancedTroubleshooting: advancedTroubleshooting,
      source: ActionSource.viewer,
      isCasting: isCasting,
      timelineOrigin: timelineOrigin,
      originalTheme: originalTheme,
    );

    final menuChildren = ActionButtonBuilder.buildViewerKebabMenu(actionContext, context, ref);

    return MenuAnchor(
      consumeOutsideTap: true,
      style: MenuStyle(
        backgroundColor: WidgetStatePropertyAll(context.themeData.scaffoldBackgroundColor),
        surfaceTintColor: const WidgetStatePropertyAll(Colors.grey),
        elevation: const WidgetStatePropertyAll(4),
        shape: const WidgetStatePropertyAll(
          RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
        ),
        padding: const WidgetStatePropertyAll(EdgeInsets.symmetric(vertical: 6)),
      ),
      menuChildren: [
        ConstrainedBox(
          constraints: const BoxConstraints(minWidth: 150),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: menuChildren,
          ),
        ),
      ],
      builder: (context, controller, child) {
        return IconButton(
          icon: const Icon(Icons.more_vert_rounded),
          onPressed: () => controller.isOpen ? controller.close() : controller.open(),
        );
      },
    );
  }
}
