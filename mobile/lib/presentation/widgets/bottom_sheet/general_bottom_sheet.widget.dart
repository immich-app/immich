import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/asset_actions.dart';
import 'package:immich_mobile/presentation/actions/share.action.dart';
import 'package:immich_mobile/presentation/actions/share_link.action.dart';
import 'package:immich_mobile/presentation/actions/timeline.action.dart';
import 'package:immich_mobile/presentation/widgets/album/album_selector.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
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

    final scope = ActionScope.from(context, ref);
    final assets = multiselect.selectedAssets.toList(growable: false);
    final actions = AssetActions.from(scope, assets);

    return BaseBottomSheet(
      controller: sheetController,
      initialChildSize: widget.minChildSize ?? 0.15,
      minChildSize: widget.minChildSize,
      maxChildSize: 0.85,
      shouldCloseOnMinExtent: false,
      actions: [
        ...[
          actions.debug,
          actions.favorite,
          actions.archive,
          actions.delete,
          actions.cleanup,
          actions.stack,
          actions.lock,
          actions.editDateTime,
          actions.editLocation,
          actions.download,
          actions.tag,
        ].map((action) => ActionColumnButtonWidget(action: TimelineAction(action: action))),
        ActionColumnButtonWidget(
          action: ShareAction(assets: assets, scope: scope),
        ),
        if (multiselect.hasRemote) ...[
          ActionColumnButtonWidget(
            action: ShareLinkAction(assets: assets, scope: scope),
          ),
        ],
        ActionColumnButtonWidget(action: TimelineAction(action: actions.upload)),
      ],
      slivers: [
        const AddToAlbumHeader(),
        AlbumSelector(onAlbumSelected: addToAlbum, onKeyboardExpanded: onKeyboardExpand),
      ],
    );
  }
}
