import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/asset_debug.action.dart';
import 'package:immich_mobile/presentation/actions/favorite.action.dart';
import 'package:immich_mobile/presentation/actions/timeline.action.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/archive_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/bulk_tag_assets_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_local_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_permanent_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/edit_date_time_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/edit_location_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/move_to_lock_folder_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_link_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/stack_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/trash_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/unstack_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/upload_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/album/album_selector.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user_metadata.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class GeneralBottomSheet extends ConsumerStatefulWidget {
  final double? minChildSize;
  const GeneralBottomSheet({super.key, this.minChildSize});

  @override
  ConsumerState<GeneralBottomSheet> createState() => _GeneralBottomSheetState();
}

class _GeneralBottomSheetState extends ConsumerState<GeneralBottomSheet> {
  late DraggableScrollableController sheetController;
  @override
  void initState() {
    super.initState();
    sheetController = DraggableScrollableController();
  }

  @override
  void dispose() {
    sheetController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final multiselect = ref.watch(multiSelectProvider);
    final isTrashEnable = ref.watch(serverInfoProvider.select((state) => state.serverFeatures.trash));
    final tagsEnabled = ref.watch(
      userMetadataPreferencesProvider.select((value) => value.valueOrNull?.tagsEnabled ?? false),
    );

    Future<void> addToAlbum(RemoteAlbum album) async {
      final result = await ref.read(actionProvider.notifier).addToAlbum(ActionSource.timeline, album);

      if (!context.mounted) {
        return;
      }

      if (!result.success) {
        ImmichToast.show(context: context, msg: 'scaffold_body_error_occurred'.tr(), toastType: ToastType.error);
        return;
      }
      ImmichToast.show(
        context: context,
        msg: result.count == 0
            ? 'add_to_album_bottom_sheet_already_exists'.tr(namedArgs: {'album': album.name})
            : 'add_to_album_bottom_sheet_added'.tr(namedArgs: {'album': album.name}),
      );
    }

    Future<void> onKeyboardExpand() {
      return sheetController.animateTo(0.85, duration: const Duration(milliseconds: 200), curve: Curves.easeInOut);
    }

    final assets = multiselect.selectedAssets.toList(growable: false);
    final actions = [AssetDebugAction(assets: assets), FavoriteAction(assets: assets)];

    return BaseBottomSheet(
      controller: sheetController,
      initialChildSize: widget.minChildSize ?? 0.15,
      minChildSize: widget.minChildSize,
      maxChildSize: 0.85,
      shouldCloseOnMinExtent: false,
      actions: [
        ...actions.map((action) => ActionColumnButtonWidget(action: TimelineAction(action: action))),
        const ShareActionButton(source: ActionSource.timeline),
        if (multiselect.hasRemote) ...[
          const ShareLinkActionButton(source: ActionSource.timeline),
          if (multiselect.onlyRemote) const DownloadActionButton(source: ActionSource.timeline),
          isTrashEnable
              ? const TrashActionButton(source: ActionSource.timeline)
              : const DeletePermanentActionButton(source: ActionSource.timeline),
          const ArchiveActionButton(source: ActionSource.timeline),
          if (tagsEnabled) const BulkTagAssetsActionButton(source: ActionSource.timeline),
          const EditDateTimeActionButton(source: ActionSource.timeline),
          const EditLocationActionButton(source: ActionSource.timeline),
          const MoveToLockFolderActionButton(source: ActionSource.timeline),
          if (multiselect.selectedAssets.length > 1) const StackActionButton(source: ActionSource.timeline),
          if (multiselect.hasStacked) const UnStackActionButton(source: ActionSource.timeline),
          if (multiselect.onlyLocal || multiselect.hasMerged) const DeleteActionButton(source: ActionSource.timeline),
        ],
        if (multiselect.onlyLocal || multiselect.hasMerged)
          const DeleteLocalActionButton(source: ActionSource.timeline),
        if (multiselect.onlyLocal) const UploadActionButton(source: ActionSource.timeline),
      ],
      slivers: [
        const AddToAlbumHeader(),
        AlbumSelector(onAlbumSelected: addToAlbum, onKeyboardExpanded: onKeyboardExpand),
      ],
    );
  }
}
