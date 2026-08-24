import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/add_to_album.action.dart';
import 'package:immich_mobile/presentation/actions/asset_debug.action.dart';
import 'package:immich_mobile/presentation/actions/download.action.dart';
import 'package:immich_mobile/presentation/actions/share.action.dart';
import 'package:immich_mobile/presentation/widgets/album/album_selector.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';

class PartnerDetailBottomSheet extends ConsumerStatefulWidget {
  const PartnerDetailBottomSheet({super.key});

  @override
  ConsumerState<PartnerDetailBottomSheet> createState() => _PartnerDetailBottomSheetState();
}

class _PartnerDetailBottomSheetState extends ConsumerState<PartnerDetailBottomSheet> {
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
    Future<void> onKeyboardExpand() {
      return sheetController.animateTo(0.85, duration: const Duration(milliseconds: 200), curve: Curves.easeInOut);
    }

    return BaseBottomSheet(
      controller: sheetController,
      initialChildSize: 0.25,
      maxChildSize: 0.85,
      shouldCloseOnMinExtent: false,
      actions: const <ActionColumnButton>[
        .new(action: AssetDebugAction(source: .timeline)),
        .new(action: ShareAction(source: .timeline)),
        .new(action: DownloadAction(source: .timeline)),
      ],
      slivers: [
        const AddToAlbumHeader(),
        AlbumSelector(
          onAlbumSelected: (album) => addAssetsToAlbum(context, ref, .timeline, album),
          onKeyboardExpanded: onKeyboardExpand,
        ),
      ],
    );
  }
}
