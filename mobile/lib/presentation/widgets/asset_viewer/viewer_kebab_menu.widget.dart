import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/cast_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/motion_photo_action_button.widget.dart';
import 'package:immich_mobile/providers/cast.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class ViewerKebabMenu extends ConsumerWidget {
  const ViewerKebabMenu({super.key});

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
    final showViewInTimelineButton =
        timelineOrigin != TimelineOrigin.main &&
        timelineOrigin != TimelineOrigin.deepLink &&
        timelineOrigin != TimelineOrigin.trash &&
        timelineOrigin != TimelineOrigin.archive &&
        timelineOrigin != TimelineOrigin.localAlbum &&
        isOwner;

    final menuChildren = <Widget>[
      BaseActionButton(
        label: 'open_asset_info'.tr(),
        iconData: Icons.info_outline,
        menuItem: true,
        onPressed: () => EventStream.shared.emit(const ViewerOpenBottomSheetEvent()),
      ),
    ];

    // Add motion photo button
    if (asset.isMotionPhoto) {
      menuChildren.add(const MotionPhotoActionButton(menuItem: true));
    }

    // Add view in timeline button
    if (showViewInTimelineButton) {
      menuChildren.add(
        BaseActionButton(
          label: 'view_in_timeline'.t(context: context),
          iconData: Icons.image_search,
          menuItem: true,
          onPressed: () async {
            await context.maybePop();
            await context.navigateTo(const TabShellRoute(children: [MainTimelineRoute()]));
            EventStream.shared.emit(ScrollToDateEvent(asset.createdAt));
          },
        ),
      );
    }

    // Add cast button if casting or has remote
    if (isCasting || asset.hasRemote) {
      menuChildren.add(const CastActionButton(menuItem: true));
    }

    // Add download button if remote only
    if (asset.isRemoteOnly) {
      menuChildren.add(const DownloadActionButton(source: ActionSource.viewer, menuItem: true));
    }

    return MenuAnchor(
      consumeOutsideTap: true,
      style: MenuStyle(
        backgroundColor: WidgetStatePropertyAll(context.themeData.scaffoldBackgroundColor),
        elevation: const WidgetStatePropertyAll(4),
        shape: const WidgetStatePropertyAll(
          RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
        ),
      ),
      menuChildren: menuChildren,
      builder: (context, controller, child) {
        return IconButton(
          icon: const Icon(Icons.more_vert_rounded),
          onPressed: () => controller.isOpen ? controller.close() : controller.open(),
        );
      },
    );
  }
}
