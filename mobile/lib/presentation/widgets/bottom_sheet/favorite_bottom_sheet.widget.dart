import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/add_to_album.action.dart';
import 'package:immich_mobile/presentation/actions/archive.action.dart';
import 'package:immich_mobile/presentation/actions/asset_debug.action.dart';
import 'package:immich_mobile/presentation/actions/delete.action.dart';
import 'package:immich_mobile/presentation/actions/download.action.dart';
import 'package:immich_mobile/presentation/actions/edit_datetime.action.dart';
import 'package:immich_mobile/presentation/actions/edit_location.action.dart';
import 'package:immich_mobile/presentation/actions/favorite.action.dart';
import 'package:immich_mobile/presentation/actions/lock.action.dart';
import 'package:immich_mobile/presentation/actions/share.action.dart';
import 'package:immich_mobile/presentation/actions/share_link.action.dart';
import 'package:immich_mobile/presentation/actions/stack.action.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class FavoriteBottomSheet extends ConsumerWidget {
  const FavoriteBottomSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final multiselect = ref.watch(multiSelectProvider);

    return BaseBottomSheet(
      initialChildSize: 0.4,
      maxChildSize: 0.7,
      shouldCloseOnMinExtent: false,
      actions: const <ActionColumnButton>[
        .new(action: AssetDebugAction(source: .timeline)),
        .new(action: ShareAction(source: .timeline)),
        .new(action: ShareLinkAction(source: .timeline)),
        .new(action: FavoriteAction(source: .timeline)),
        .new(action: ArchiveAction(source: .timeline)),
        .new(action: DownloadAction(source: .timeline)),
        .new(action: DeleteAction(source: .timeline)),
        .new(action: EditDateTimeAction(source: .timeline)),
        .new(action: EditLocationAction(source: .timeline)),
        .new(action: LockAction(source: .timeline)),
        .new(action: StackAction(source: .timeline)),
        .new(action: CleanupLocalAction(source: .timeline)),
      ],
      slivers: multiselect.hasRemote ? [const AddToAlbumSlivers()] : [],
    );
  }
}
