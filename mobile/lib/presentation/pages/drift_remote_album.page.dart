import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/album/pending_uploads_banner.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/remote_album_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/remote_album/drift_album_option.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/remote_album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/option.dart';
import 'package:immich_mobile/presentation/widgets/album_reorder/album_reorder_grid.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.page.dart';
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
  AlbumSortOrder _sortOrder = AlbumSortOrder.date;
  AlbumReorderInteractionMode _interactionMode = AlbumReorderInteractionMode.select;
  List<BaseAsset>? _customSortedAssets;
  bool _isLoadingPositions = false;

  @override
  void initState() {
    super.initState();
    _album = widget.album;
    _sortOrder = _album.orderBy;
    if (_sortOrder == AlbumSortOrder.custom) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _fetchCustomSortedAssets();
      });
    }
  }

  Future<void> addAssets(BuildContext context) async {
    final notifier = ref.read(remoteAlbumProvider.notifier);
    final albumAssets = await notifier.getAssets(_album.id);

    final newAssets = await context.pushRoute<Set<BaseAsset>>(
      DriftAssetSelectionTimelineRoute(lockedSelectionAssets: albumAssets.toSet()),
    );

    if (newAssets == null || newAssets.isEmpty) {
      return;
    }

    final added = await notifier.addAssetsToAlbum(_album.id, newAssets);

    if (added > 0 && context.mounted) {
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

  Future<void> toggleSortOrder() async {
    final newSortOrder = _sortOrder == AlbumSortOrder.date ? AlbumSortOrder.custom : AlbumSortOrder.date;
    try {
      final updated = await ref.read(remoteAlbumProvider.notifier).toggleAlbumOrderBy(_album.id);
      if (updated != null && mounted) {
        setState(() {
          _album = updated;
          _sortOrder = updated.orderBy;
        });
        if (newSortOrder == AlbumSortOrder.custom) {
          _interactionMode = AlbumReorderInteractionMode.select;
          await _fetchCustomSortedAssets();
        } else {
          _customSortedAssets = null;
          ref.invalidate(timelineServiceProvider);
        }
      }
    } catch (e) {
      if (mounted) {
        ImmichToast.show(context: context, msg: 'Failed to change sort mode', toastType: ToastType.error);
      }
    }
  }

  void toggleInteractionMode() {
    // Clear multi-select BEFORE triggering rebuild so ThumbnailTile
    // reads the empty selection state when it first renders in the new mode.
    ref.read(multiSelectProvider.notifier).reset();
    setState(() {
      _interactionMode = _interactionMode == AlbumReorderInteractionMode.select
          ? AlbumReorderInteractionMode.reorder
          : AlbumReorderInteractionMode.select;
    });
  }

  Future<void> _fetchCustomSortedAssets() async {
    setState(() => _isLoadingPositions = true);
    try {
      final notifier = ref.read(remoteAlbumProvider.notifier);

      // Fetch album assets directly via the API, bypassing the timeline
      // service (which is scoped via ProviderScope and not accessible from
      // the page-level ref).
      final allAssets = await notifier.getAssets(_album.id);

      // Fetch CRDT positions and sort
      final positions = await notifier.getAlbumAssetPositions(_album.id);

      if (positions.isNotEmpty && allAssets.isNotEmpty) {
        final positionMap = <String, String>{};
        for (final p in positions) {
          positionMap[p.assetId] = p.position;
        }

        // Sort: positioned assets first (by position string), unpositioned last.
        allAssets.sort((a, b) {
          final posA = positionMap[a.id];
          final posB = positionMap[b.id];
          if (posA != null && posB != null) {
            return posA.compareTo(posB);
          }
          if (posA != null) return -1;
          if (posB != null) return 1;
          return 0;
        });
      }

      if (mounted) {
        setState(() {
          _customSortedAssets = allAssets;
          _isLoadingPositions = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingPositions = false);
        ImmichToast.show(context: context, msg: 'Failed to load asset positions', toastType: ToastType.error);
      }
    }
  }

  Future<bool> _handleMove(String assetId, List<String> orderedAssetIds) async {
    try {
      await ref.read(remoteAlbumProvider.notifier).moveAlbumAsset(
        _album.id,
        assetId: assetId,
        assetIds: orderedAssetIds,
      );
      if (mounted && _customSortedAssets != null) {
        final assetMap = <String, BaseAsset>{};
        for (final a in _customSortedAssets!) {
          assetMap[a.id] = a;
        }
        setState(() {
          _customSortedAssets = orderedAssetIds.map((id) => assetMap[id]!).toList();
        });
      }
      return true;
    } catch (e) {
      if (mounted) {
        ImmichToast.show(context: context, msg: 'Failed to save reorder', toastType: ToastType.error);
      }
      return false;
    }
  }

  void _openAssetViewer(BaseAsset asset, List<BaseAsset> orderedAssets) {
    final index = orderedAssets.indexOf(asset);
    if (index == -1) return;

    // Build the timeline service from the grid's current ordered list so
    // the viewer shows assets in the same order the user sees on screen,
    // even before a reorder has been persisted to the server.
    final viewerTimelineService = ref
        .read(timelineFactoryProvider)
        .fromAssets(orderedAssets, TimelineOrigin.remoteAlbum);

    // MUST call setAsset before pushing the route (required by AssetViewerPage).
    AssetViewer.setAsset(ref, asset);

    unawaited(
      context.pushRoute(AssetViewerRoute(
        initialIndex: index,
        timelineService: viewerTimelineService,
        currentAlbum: _album,
      )),
    );
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

        unawaited(context.pushRoute(const DriftAlbumsRoute()));
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
      unawaited(HapticFeedback.mediumImpact());
    }
  }

  Future<void> showActivity(BuildContext context) async {
    unawaited(context.pushRoute(DriftActivitiesRoute(album: _album)));
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final isOwner = user != null ? user.id == _album.ownerId : false;

    final timelineOverride = timelineServiceProvider.overrideWith((ref) {
      final timelineService = ref.watch(timelineFactoryProvider).remoteAlbum(albumId: _album.id);
      ref.onDispose(timelineService.dispose);
      return timelineService;
    });

    // Single ProviderScope shared by both sort modes — prevents provider
    // teardown/recreation when toggling between date and custom sort.
    return ProviderScope(
      overrides: [
        timelineOverride,
        currentRemoteAlbumScopedProvider.overrideWithValue(_album),
      ],
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        switchInCurve: Curves.easeOut,
        switchOutCurve: Curves.easeIn,
        child: _sortOrder == AlbumSortOrder.custom
            ? _buildCustomSortMode(isOwner)
            : _buildDateSortMode(isOwner),
      ),
    );
  }

  Widget _buildCustomSortMode(bool isOwner) {
    return Consumer(
      builder: (context, ref, child) {
        final isMultiSelectEnabled = ref.watch(multiSelectProvider.select((s) => s.isEnabled));
        final canPop = !isMultiSelectEnabled && _interactionMode != AlbumReorderInteractionMode.reorder;

        return PopScope(
          canPop: canPop,
          onPopInvokedWithResult: (didPop, result) {
            if (didPop) return;
            if (isMultiSelectEnabled) {
              ref.read(multiSelectProvider.notifier).reset();
            } else if (_interactionMode == AlbumReorderInteractionMode.reorder) {
              toggleInteractionMode();
            }
          },
          child: Scaffold(
            key: const ValueKey('custom_sort'),
            body: Stack(
              children: [
                NestedScrollView(
                  headerSliverBuilder: (context, innerBoxIsScrolled) => [
                    RemoteAlbumSliverAppBar(
                      icon: Icons.photo_album_outlined,
                      kebabMenu: _AlbumKebabMenu(
                        album: _album,
                        onDeleteAlbum: () => deleteAlbum(context),
                        onAddUsers: () => addUsers(context),
                        onAddPhotos: () => addAssets(context),
                        onEditAlbum: () => showEditTitleAndDescription(context),
                        onCreateSharedLink: () =>
                            unawaited(context.pushRoute(SharedLinkEditRoute(albumId: _album.id))),
                        onShowOptions: () => context.pushRoute(DriftAlbumOptionsRoute(album: _album)),
                      ),
                      onEditTitle: isOwner ? () => showEditTitleAndDescription(context) : null,
                      onActivity: () => showActivity(context),
                      onToggleInteractionMode: isOwner ? toggleInteractionMode : null,
                      interactionModeTooltip: _interactionMode == AlbumReorderInteractionMode.reorder
                          ? 'select_mode'.t(context: context)
                          : 'drag_to_reorder'.t(context: context),
                      interactionModeActive: _interactionMode == AlbumReorderInteractionMode.reorder,
                      onToggleSortOrder: isOwner ? toggleSortOrder : null,
                      sortOrderActive: true,
                      sortOrderTooltip: _sortOrder == AlbumSortOrder.custom
                          ? 'date_order'.t(context: context)
                          : 'custom_order'.t(context: context),
                    ),
                  ],
                  body: _isLoadingPositions
                      ? const Center(child: CircularProgressIndicator())
                      : _customSortedAssets != null
                          ? AlbumReorderGrid(
                              assets: _customSortedAssets!,
                              interactionMode: _interactionMode,
                              onClickAsset: _openAssetViewer,
                              onMove: _handleMove,
                            )
                          : const Center(child: Text('No assets')),
                ),
                if (isMultiSelectEnabled) RemoteAlbumBottomSheet(album: _album),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildDateSortMode(bool isOwner) {
    return Timeline(
      key: const ValueKey('date_sort'),
      topSliverWidget: PendingUploadsBanner(albumId: _album.id),
      appBar: RemoteAlbumSliverAppBar(
        icon: Icons.photo_album_outlined,
        kebabMenu: _AlbumKebabMenu(
          album: _album,
          onDeleteAlbum: () => deleteAlbum(context),
          onAddUsers: () => addUsers(context),
          onAddPhotos: () => addAssets(context),
          onEditAlbum: () => showEditTitleAndDescription(context),
          onCreateSharedLink: () =>
              unawaited(context.pushRoute(SharedLinkEditRoute(albumId: _album.id))),
          onShowOptions: () => context.pushRoute(DriftAlbumOptionsRoute(album: _album)),
        ),
        onEditTitle: isOwner ? () => showEditTitleAndDescription(context) : null,
        onActivity: () => showActivity(context),
        onToggleSortOrder: isOwner ? toggleSortOrder : null,
        sortOrderTooltip: _sortOrder == AlbumSortOrder.custom
            ? 'date_order'.t(context: context)
            : 'custom_order'.t(context: context),
      ),
      bottomSheet: RemoteAlbumBottomSheet(album: _album),
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
    if (formKey.currentState?.validate() != true) {
      return;
    }

    try {
      final newTitle = titleController.text.trim();
      final newDescription = descriptionController.text.trim();

      await ref
          .read(remoteAlbumProvider.notifier)
          .updateAlbum(widget.album.id, name: newTitle, description: newDescription);

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

class _AlbumKebabMenu extends ConsumerWidget {
  final RemoteAlbum album;
  final VoidCallback? onDeleteAlbum;
  final VoidCallback? onAddUsers;
  final VoidCallback? onAddPhotos;
  final VoidCallback? onEditAlbum;
  final VoidCallback? onCreateSharedLink;
  final VoidCallback? onShowOptions;

  const _AlbumKebabMenu({
    required this.album,
    this.onDeleteAlbum,
    this.onAddUsers,
    this.onAddPhotos,
    this.onEditAlbum,
    this.onCreateSharedLink,
    this.onShowOptions,
  });

  double _calculateScrollProgress(FlexibleSpaceBarSettings? settings) {
    if (settings?.maxExtent == null || settings?.minExtent == null) {
      return 1.0;
    }

    final deltaExtent = settings!.maxExtent - settings.minExtent;
    if (deltaExtent <= 0.0) {
      return 1.0;
    }

    return (1.0 - (settings.currentExtent - settings.minExtent) / deltaExtent).clamp(0.0, 1.0);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = context.dependOnInheritedWidgetOfExactType<FlexibleSpaceBarSettings>();
    final scrollProgress = _calculateScrollProgress(settings);

    final iconColor = Color.lerp(Colors.white, context.primaryColor, scrollProgress);
    final iconShadows = [
      if (scrollProgress < 0.95)
        Shadow(offset: const Offset(0, 2), blurRadius: 5, color: Colors.black.withValues(alpha: 0.5))
      else
        const Shadow(offset: Offset(0, 2), blurRadius: 0, color: Colors.transparent),
    ];

    final user = ref.watch(currentUserProvider);
    final isOwner = user != null && user.id == album.ownerId;

    return FutureBuilder<bool>(
      future: ref
          .read(remoteAlbumServiceProvider)
          .getUserRole(album.id, user?.id ?? '')
          .then((role) => role == AlbumUserRole.editor),
      builder: (context, snapshot) {
        final canAddPhotos = snapshot.data ?? false;

        return DriftRemoteAlbumOption(
          iconColor: iconColor,
          iconShadows: iconShadows,
          onDeleteAlbum: isOwner ? onDeleteAlbum : null,
          onAddUsers: isOwner ? onAddUsers : null,
          onAddPhotos: isOwner || canAddPhotos ? onAddPhotos : null,
          onEditAlbum: isOwner ? onEditAlbum : null,
          onCreateSharedLink: isOwner ? onCreateSharedLink : null,
          onShowOptions: onShowOptions,
        );
      },
    );
  }
}
