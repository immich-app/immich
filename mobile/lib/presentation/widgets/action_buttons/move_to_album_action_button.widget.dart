import 'dart:async';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/album/album_selector.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/action.service.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:auto_route/auto_route.dart';

class MoveToAlbumActionButton extends ConsumerWidget {
  final String albumId;
  final ActionSource source;
  final bool iconOnly;
  final bool menuItem;

  const MoveToAlbumActionButton({
    super.key,
    required this.albumId,
    required this.source,
    this.iconOnly = false,
    this.menuItem = false,
  });

  void _onTap(BuildContext context, WidgetRef ref) {
    Navigator.of(context).pop();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) {
        return BaseBottomSheet(
          actions: const [],
          slivers: [
            MoveToAlbumHeader(albumId: albumId),
            AlbumSelector(
              onAlbumSelected: (targetAlbum) => _moveAssetsToAlbum(context, ref, targetAlbum),
            ),
          ],
          initialChildSize: 0.6,
          minChildSize: 0.3,
          maxChildSize: 0.95,
          expand: false,
          backgroundColor: context.isDarkTheme ? Colors.black : Colors.white,
        );
      },
    );
  }

  Future<void> _moveAssetsToAlbum(BuildContext context, WidgetRef ref, RemoteAlbum targetAlbum) async {
    if (targetAlbum.id == albumId) {
      ImmichToast.show(
        context: context,
        msg: 'errors.cannot_move_to_same_album'.t(context: context),
        toastType: ToastType.error,
      );
      return;
    }

    if (context.mounted) {
      Navigator.of(context).pop();
    }

    if (source == ActionSource.viewer) {
      EventStream.shared.emit(const ViewerReloadAssetEvent());
    }

    final result = await ref.read(actionProvider.notifier).moveToAlbum(source, albumId, targetAlbum);

    final successMessage = 'assets_moved_to_album'.t(
      context: context,
      args: {
        'count': result.count.toString(),
        'album': targetAlbum.name,
      },
    );

    if (context.mounted) {
      ImmichToast.show(
        context: context,
        msg: result.success ? successMessage : 'scaffold_body_error_occurred'.t(context: context),
        gravity: ToastGravity.BOTTOM,
        toastType: result.success ? ToastType.success : ToastType.error,
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.drive_file_move_outlined,
      label: "move_to_album".t(context: context),
      iconOnly: iconOnly,
      menuItem: menuItem,
      onPressed: () => _onTap(context, ref),
      maxWidth: 100,
    );
  }
}

class MoveToAlbumHeader extends ConsumerWidget {
  final String albumId;
  const MoveToAlbumHeader({super.key, required this.albumId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Future<void> onCreateAlbum() async {
      final selectedAssets = ref.read(multiSelectProvider).selectedAssets;
      if (selectedAssets.isEmpty) {
        return;
      }

      final newAlbum = await ref
          .read(remoteAlbumProvider.notifier)
          .createAlbumWithAssets(title: "Untitled Album", assets: selectedAssets);

      if (newAlbum == null) {
        ImmichToast.show(context: context, toastType: ToastType.error, msg: 'errors.failed_to_create_album'.tr());
        return;
      }

      try {
        final ids = selectedAssets.whereType<RemoteAsset>().map((e) => e.id).toList(growable: false);
        if (ids.isNotEmpty) {
          await ref.read(actionServiceProvider).removeFromAlbum(ids, albumId);
        }
      } catch (e) {
        // Ignored
      }

      ref.read(multiSelectProvider.notifier).reset();

      if (context.mounted) {
        Navigator.of(context).pop();
        unawaited(context.pushRoute(RemoteAlbumRoute(album: newAlbum)));
      }
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverToBoxAdapter(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text("move_to_album", style: context.textTheme.titleSmall).tr(),
            TextButton.icon(
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                minimumSize: const Size(0, 0),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              onPressed: onCreateAlbum,
              icon: Icon(Icons.add, color: context.primaryColor),
              label: Text(
                "common_create_new_album",
                style: TextStyle(color: context.primaryColor, fontWeight: FontWeight.bold, fontSize: 14),
              ).tr(),
            ),
          ],
        ),
      ),
    );
  }
}
