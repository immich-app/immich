import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_local_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/upload_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/album/album_selector.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/utils/add_to_album.utils.dart';

class LocalAlbumBottomSheet extends ConsumerStatefulWidget {
  const LocalAlbumBottomSheet({super.key});

  @override
  ConsumerState<LocalAlbumBottomSheet> createState() => _LocalAlbumBottomSheetState();
}

class _LocalAlbumBottomSheetState extends ConsumerState<LocalAlbumBottomSheet> {
  late final DraggableScrollableController sheetController;

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
    Future<void> addAssetsToAlbum(RemoteAlbum album) async {
      final selectedAssets = ref.read(multiSelectProvider).selectedAssets.toList(growable: false);
      if (selectedAssets.isEmpty) {
        return;
      }
      await addSelectedAssetsToAlbum(context, ref, album, selectedAssets);
    }

    Future<void> onKeyboardExpand() {
      return sheetController.animateTo(0.85, duration: const Duration(milliseconds: 200), curve: Curves.easeInOut);
    }

    return BaseBottomSheet(
      controller: sheetController,
      initialChildSize: 0.25,
      maxChildSize: 0.85,
      shouldCloseOnMinExtent: false,
      actions: const [
        ShareActionButton(source: ActionSource.timeline),
        DeleteLocalActionButton(source: ActionSource.timeline),
        UploadActionButton(source: ActionSource.timeline),
      ],
      slivers: [
        const AddToAlbumHeader(),
        AlbumSelector(onAlbumSelected: addAssetsToAlbum, onKeyboardExpanded: onKeyboardExpand),
      ],
    );
  }
}
