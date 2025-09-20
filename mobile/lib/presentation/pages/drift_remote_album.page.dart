import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/remote_album_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/remote_album/drift_album_option.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/remote_album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/common/remote_album_sliver_app_bar.dart';

@RoutePage()
class RemoteAlbumPage extends ConsumerStatefulWidget {
  final RemoteAlbum album;

  const RemoteAlbumPage({super.key, required this.album});

  @override
  ConsumerState<RemoteAlbumPage> createState() => _RemoteAlbumPageState();
}

class _RemoteAlbumPageState extends ConsumerState<RemoteAlbumPage> {
  late RemoteAlbum _album;
  @override
  void initState() {
    super.initState();
    _album = widget.album;
  }

  Future<void> addAssets(BuildContext context) async {
    final albumAssets = await ref.read(remoteAlbumProvider.notifier).getAssets(_album.id);

    final newAssets = await context.pushRoute<Set<BaseAsset>>(
      DriftAssetSelectionTimelineRoute(lockedSelectionAssets: albumAssets.toSet()),
    );

    if (newAssets == null || newAssets.isEmpty) {
      return;
    }

    final added = await ref
        .read(remoteAlbumProvider.notifier)
        .addAssets(
          _album.id,
          newAssets.map((asset) {
            final remoteAsset = asset as RemoteAsset;
            return remoteAsset.id;
          }).toList(),
        );

    if (added > 0) {
      ImmichToast.show(
        context: context,
        msg: "assets_added_to_album_count".t(context: context, args: {'count': added.toString()}),
        toastType: ToastType.success,
      );
    }
  }

  Future<void> addUsers(BuildContext context) async {
    final newUsers = await context.pushRoute<List<String>>(DriftUserSelectionRoute(album: _album));

    if (newUsers == null || newUsers.isEmpty) {
      return;
    }

    try {
      await ref.read(remoteAlbumProvider.notifier).addUsers(_album.id, newUsers);

      if (newUsers.isNotEmpty) {
        ImmichToast.show(
          context: context,
          msg: "users_added_to_album_count".t(context: context, args: {'count': newUsers.length}),
          toastType: ToastType.success,
        );
      }

      ref.invalidate(remoteAlbumSharedUsersProvider(_album.id));
    } catch (e) {
      ImmichToast.show(
        context: context,
        msg: "Failed to add users to album: ${e.toString()}",
        toastType: ToastType.error,
      );
    }
  }

  Future<void> toggleAlbumOrder() async {
    await ref.read(remoteAlbumProvider.notifier).toggleAlbumOrder(_album.id);

    ref.invalidate(timelineServiceProvider);
  }

  Future<void> deleteAlbum(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('delete_album'.t(context: context)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('album_delete_confirmation'.t(context: context, args: {'album': _album.name})),
              const SizedBox(height: 8),
              Text('album_delete_confirmation_description'.t(context: context)),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text('cancel'.t(context: context)),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: TextButton.styleFrom(foregroundColor: Theme.of(context).colorScheme.error),
              child: Text('delete_album'.t(context: context)),
            ),
          ],
        );
      },
    );

    if (confirmed == true) {
      try {
        await ref.read(remoteAlbumProvider.notifier).deleteAlbum(_album.id);

        ImmichToast.show(
          context: context,
          msg: 'album_deleted'.t(context: context),
          toastType: ToastType.success,
        );

        context.pushRoute(const DriftAlbumsRoute());
      } catch (e) {
        ImmichToast.show(
          context: context,
          msg: 'album_viewer_appbar_share_err_delete'.t(context: context),
          toastType: ToastType.error,
        );
      }
    }
  }

  Future<void> showEditTitleAndDescription(BuildContext context) async {
    final result = await showDialog<_EditAlbumData?>(
      context: context,
      barrierDismissible: true,
      builder: (context) => _EditAlbumDialog(album: _album),
    );

    if (result != null && context.mounted) {
      setState(() {
        _album = _album.copyWith(name: result.name, description: result.description ?? '');
      });
      HapticFeedback.mediumImpact();
    }
  }

  Future<void> showActivity(BuildContext context) async {
    context.pushRoute(const DriftActivitiesRoute());
  }

  void showOptionSheet(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final isOwner = user != null ? user.id == _album.ownerId : false;

    showModalBottomSheet(
      context: context,
      backgroundColor: context.colorScheme.surface,
      isScrollControlled: false,
      builder: (context) {
        return DriftRemoteAlbumOption(
          onDeleteAlbum: isOwner
              ? () async {
                  await deleteAlbum(context);
                  if (context.mounted) {
                    context.pop();
                  }
                }
              : null,
          onAddUsers: isOwner
              ? () async {
                  await addUsers(context);
                  context.pop();
                }
              : null,
          onAddPhotos: () async {
            await addAssets(context);
            context.pop();
          },
          onToggleAlbumOrder: () async {
            await toggleAlbumOrder();
            context.pop();
          },
          onEditAlbum: () async {
            context.pop();
            await showEditTitleAndDescription(context);
          },
          onCreateSharedLink: () async {
            context.pop();
            context.pushRoute(SharedLinkEditRoute(albumId: _album.id));
          },
          onShowOptions: () {
            context.pop();
            context.pushRoute(const DriftAlbumOptionsRoute());
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop || !mounted) {
          return;
        }
        final hasAncestor = context.findAncestorWidgetOfExactType<RemoteAlbumPage>() != null;
        Navigator.of(context).pop();
        if (!hasAncestor) {
          ref.read(currentRemoteAlbumProvider.notifier).dispose();
        }
      },
      child: ProviderScope(
        overrides: [
          timelineServiceProvider.overrideWith((ref) {
            final timelineService = ref.watch(timelineFactoryProvider).remoteAlbum(albumId: _album.id);
            ref.onDispose(timelineService.dispose);
            return timelineService;
          }),
        ],
        child: Timeline(
          appBar: RemoteAlbumSliverAppBar(
            icon: Icons.photo_album_outlined,
            onShowOptions: () => showOptionSheet(context),
            onToggleAlbumOrder: () => toggleAlbumOrder(),
            onEditTitle: () => showEditTitleAndDescription(context),
            onActivity: () => showActivity(context),
          ),
          bottomSheet: RemoteAlbumBottomSheet(album: _album),
        ),
      ),
    );
  }
}

class _EditAlbumData {
  final String name;
  final String? description;

  const _EditAlbumData({required this.name, this.description});
}

class _EditAlbumDialog extends ConsumerStatefulWidget {
  final RemoteAlbum album;

  const _EditAlbumDialog({required this.album});

  @override
  ConsumerState<_EditAlbumDialog> createState() => _EditAlbumDialogState();
}

class _EditAlbumDialogState extends ConsumerState<_EditAlbumDialog> {
  late final TextEditingController titleController;
  late final TextEditingController descriptionController;
  final formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    titleController = TextEditingController(text: widget.album.name);
    descriptionController = TextEditingController(
      text: widget.album.description.isEmpty ? '' : widget.album.description,
    );
  }

  @override
  void dispose() {
    titleController.dispose();
    descriptionController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (formKey.currentState?.validate() != true) return;

    try {
      final newTitle = titleController.text.trim();
      final newDescription = descriptionController.text.trim();

      await ref
          .read(remoteAlbumProvider.notifier)
          .updateAlbum(widget.album.id, name: newTitle, description: newDescription.isEmpty ? null : newDescription);

      if (mounted) {
        Navigator.of(
          context,
        ).pop(_EditAlbumData(name: newTitle, description: newDescription.isEmpty ? null : newDescription));
      }
    } catch (e) {
      if (mounted) {
        ImmichToast.show(
          context: context,
          msg: 'album_update_error'.t(context: context),
          toastType: ToastType.error,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.all(24),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(16))),
      child: SingleChildScrollView(
        child: Container(
          padding: const EdgeInsets.all(16),
          constraints: const BoxConstraints(maxWidth: 550),
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Icon(Icons.edit_outlined, color: context.colorScheme.primary, size: 24),
                    const SizedBox(width: 12),
                    Text('edit_album'.t(context: context), style: context.textTheme.titleMedium),
                  ],
                ),
                const SizedBox(height: 24),

                // Album Name
                Text(
                  'album_name'.t(context: context).toUpperCase(),
                  style: context.textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                TextFormField(
                  controller: titleController,
                  maxLines: 1,
                  textCapitalization: TextCapitalization.sentences,
                  decoration: InputDecoration(
                    border: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                    filled: true,
                    fillColor: context.colorScheme.surface,
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'album_name_required'.t(context: context);
                    }

                    return null;
                  },
                ),
                const SizedBox(height: 18),

                // Description
                Text(
                  'description'.t(context: context).toUpperCase(),
                  style: context.textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                TextFormField(
                  controller: descriptionController,
                  maxLines: 4,
                  textCapitalization: TextCapitalization.sentences,
                  decoration: InputDecoration(
                    border: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                    filled: true,
                    fillColor: context.colorScheme.surface,
                  ),
                ),
                const SizedBox(height: 24),

                // Action Buttons
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(null),
                      child: Text('cancel'.t(context: context)),
                    ),
                    const SizedBox(width: 12),
                    FilledButton(
                      onPressed: _handleSave,
                      child: Text('save'.t(context: context)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
