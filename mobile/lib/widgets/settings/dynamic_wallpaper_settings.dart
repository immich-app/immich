import 'package:auto_route/auto_route.dart';
import 'package:crop_image/crop_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/config/dynamic_wallpaper_config.dart' as config_model;
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/platform/dynamic_wallpaper_api.g.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/people.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/dynamic_wallpaper.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/settings/settings_button_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';

final _dynamicWallpaperAssetProvider = FutureProvider.family(
  (ref, String assetId) => ref.watch(assetServiceProvider).getRemoteAsset(assetId),
);

final _dynamicWallpaperPreparationStatusProvider = FutureProvider.autoDispose(
  (ref) => ref.watch(dynamicWallpaperServiceProvider).getPreparationStatus(),
);

class DynamicWallpaperSettings extends ConsumerStatefulWidget {
  const DynamicWallpaperSettings({super.key});

  @override
  ConsumerState<DynamicWallpaperSettings> createState() => _DynamicWallpaperSettingsState();
}

class _DynamicWallpaperSettingsState extends ConsumerState<DynamicWallpaperSettings> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.invalidate(_dynamicWallpaperPreparationStatusProvider);
    }
  }

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(appConfigProvider).dynamicWallpaper;
    final service = ref.watch(dynamicWallpaperServiceProvider);
    final status = ref.watch(_dynamicWallpaperPreparationStatusProvider);
    final selectedCount = config.assetIds.length;

    return SettingsSubPageScaffold(
      showDivider: true,
      settings: [
        _DynamicWallpaperStatusTile(
          selectedCount: selectedCount,
          status: status,
          onRetry: () async {
            try {
              await service.refreshPreparedWallpapers();
            } finally {
              ref.invalidate(_dynamicWallpaperPreparationStatusProvider);
            }
          },
          onDisable: () async {
            await service.disable();
            ref.invalidate(_dynamicWallpaperPreparationStatusProvider);
          },
        ),
        SettingsButtonListTile(
          icon: Icons.photo_library_outlined,
          title: 'dynamic_wallpaper_select_title'.tr(),
          subtileText: 'dynamic_wallpaper_select_subtitle'.tr(),
          buttonText: 'dynamic_wallpaper_manage_photos'.tr(),
          onButtonTap: () => _selectWallpaperPhotos(context, ref, config.assetIds, service),
        ),
        SettingsButtonListTile(
          icon: Icons.people_alt_outlined,
          title: 'dynamic_wallpaper_people_filter_title'.tr(),
          subtileText: 'dynamic_wallpaper_people_filter_subtitle'.tr(),
          buttonText: 'dynamic_wallpaper_filter_by_people'.tr(),
          onButtonTap: () => _selectWallpaperPhotosByPeople(context, ref, config.assetIds, service),
        ),
        SettingsButtonListTile(
          icon: Icons.wallpaper_outlined,
          title: 'dynamic_wallpaper_picker_title'.tr(),
          subtileText: 'dynamic_wallpaper_picker_subtitle'.tr(namedArgs: {'count': selectedCount.toString()}),
          buttonText: 'dynamic_wallpaper_open_picker'.tr(),
          onButtonTap: selectedCount == 0
              ? null
              : () async {
                  await service.openPicker();
                  ref.invalidate(_dynamicWallpaperPreparationStatusProvider);
                },
        ),
        _DynamicWallpaperSelectionTile(
          assetIds: config.assetIds,
          assetLayouts: config.assetLayouts,
          service: service,
          onSelectionChanged: () => ref.invalidate(_dynamicWallpaperPreparationStatusProvider),
        ),
      ],
    );
  }

  Future<void> _selectWallpaperPhotos(
    BuildContext context,
    WidgetRef ref,
    List<String> currentAssetIds,
    DynamicWallpaperService service, {
    List<String> peopleFilterIds = const [],
  }) async {
    final initialAssets = await ref.read(assetServiceProvider).getRemoteAssets(currentAssetIds);

    if (!context.mounted) {
      return;
    }

    final loadedAssetIds = initialAssets.map((asset) => asset.id).toSet();
    final preservedAssetIds = currentAssetIds.where((assetId) => !loadedAssetIds.contains(assetId)).toList();

    final selectedAssets = await context.pushRoute<Set<BaseAsset>>(
      DynamicWallpaperAssetSelectionTimelineRoute(
        initialSelectedAssets: initialAssets.toSet(),
        peopleFilterIds: peopleFilterIds,
      ),
    );

    if (selectedAssets == null) {
      return;
    }

    final List<String> nextAssetIds;
    try {
      nextAssetIds = await service.replaceSelection(selectedAssets, preservedAssetIds: preservedAssetIds);
    } catch (_) {
      ref.invalidate(_dynamicWallpaperPreparationStatusProvider);
      if (context.mounted) {
        ImmichToast.show(context: context, msg: 'dynamic_wallpaper_update_failed'.tr(), toastType: ToastType.error);
      }
      return;
    }

    ref.invalidate(_dynamicWallpaperPreparationStatusProvider);

    if (context.mounted) {
      ImmichToast.show(
        context: context,
        msg: 'dynamic_wallpaper_selection_saved'.tr(namedArgs: {'count': nextAssetIds.length.toString()}),
      );
    }
  }

  Future<void> _selectWallpaperPhotosByPeople(
    BuildContext context,
    WidgetRef ref,
    List<String> currentAssetIds,
    DynamicWallpaperService service,
  ) async {
    final selectedPeople = await showModalBottomSheet<List<DriftPerson>>(
      context: context,
      useSafeArea: true,
      isScrollControlled: true,
      backgroundColor: context.colorScheme.surface,
      builder: (context) => const _DynamicWallpaperPeopleFilterSheet(),
    );

    if (selectedPeople == null || selectedPeople.isEmpty || !context.mounted) {
      return;
    }

    await _selectWallpaperPhotos(
      context,
      ref,
      currentAssetIds,
      service,
      peopleFilterIds: selectedPeople.map((person) => person.id).toList(growable: false),
    );
  }
}

class _DynamicWallpaperPeopleFilterSheet extends ConsumerStatefulWidget {
  const _DynamicWallpaperPeopleFilterSheet();

  @override
  ConsumerState<_DynamicWallpaperPeopleFilterSheet> createState() => _DynamicWallpaperPeopleFilterSheetState();
}

class _DynamicWallpaperPeopleFilterSheetState extends ConsumerState<_DynamicWallpaperPeopleFilterSheet> {
  final FocusNode _searchFocus = FocusNode();
  final Set<DriftPerson> _selectedPeople = {};
  String _search = '';

  @override
  void dispose() {
    _searchFocus.dispose();
    super.dispose();
  }

  void _togglePerson(DriftPerson person) {
    setState(() {
      if (_selectedPeople.contains(person)) {
        _selectedPeople.remove(person);
      } else {
        _selectedPeople.add(person);
      }
    });
  }

  String _personName(DriftPerson person) {
    return person.name.isEmpty ? 'add_a_name'.tr() : person.name;
  }

  @override
  Widget build(BuildContext context) {
    final people = ref.watch(driftGetAllPeopleProvider);
    final height = MediaQuery.sizeOf(context).height * 0.85;

    return SizedBox(
      height: height,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                IconButton(
                  tooltip: 'cancel'.tr(),
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close_rounded),
                ),
                Expanded(
                  child: Text(
                    'dynamic_wallpaper_people_filter_title'.tr(),
                    style: context.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                    textAlign: TextAlign.center,
                  ),
                ),
                TextButton(
                  onPressed: _selectedPeople.isEmpty
                      ? null
                      : () => Navigator.of(context).pop(_selectedPeople.toList(growable: false)),
                  child: Text('done'.tr()),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SearchField(
              focusNode: _searchFocus,
              onChanged: (value) => setState(() => _search = value),
              onTapOutside: (_) => _searchFocus.unfocus(),
              filled: true,
              hintText: 'filter_people'.tr(),
            ),
          ),
          Expanded(
            child: people.when(
              data: (people) {
                final filteredPeople = people
                    .where((person) {
                      return _personName(
                        person,
                      ).toLowerCase().removeDiacritics().contains(_search.toLowerCase().removeDiacritics());
                    })
                    .toList(growable: false);

                if (filteredPeople.isEmpty) {
                  return Center(child: Text('no_people_found'.tr()));
                }

                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: filteredPeople.length,
                  itemBuilder: (context, index) {
                    final person = filteredPeople[index];
                    final isSelected = _selectedPeople.contains(person);

                    return Padding(
                      key: ValueKey(person.id),
                      padding: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        selected: isSelected,
                        selectedTileColor: context.colorScheme.primaryContainer,
                        tileColor: context.colorScheme.surfaceContainerLow,
                        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                        leading: CircleAvatar(
                          backgroundImage: RemoteImageProvider(url: getFaceThumbnailUrl(person.id)),
                        ),
                        title: Text(
                          _personName(person),
                          overflow: TextOverflow.ellipsis,
                          style: context.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
                        ),
                        trailing: Checkbox(value: isSelected, onChanged: (_) => _togglePerson(person)),
                        onTap: () => _togglePerson(person),
                      ),
                    );
                  },
                );
              },
              error: (_, _) => Center(child: Text('get_people_error'.tr())),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
          ),
        ],
      ),
    );
  }
}

class _DynamicWallpaperStatusTile extends StatelessWidget {
  final int selectedCount;
  final AsyncValue<DynamicWallpaperStatus> status;
  final Future<void> Function() onRetry;
  final Future<void> Function() onDisable;

  const _DynamicWallpaperStatusTile({
    required this.selectedCount,
    required this.status,
    required this.onRetry,
    required this.onDisable,
  });

  @override
  Widget build(BuildContext context) {
    final value = status.valueOrNull;
    final isEnabled = value?.enabled == true;
    final hasPreparationIssue = value != null && selectedCount > 0 && (value.failedCount > 0 || value.missingCount > 0);

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      horizontalTitleGap: 20,
      leading: Icon(isEnabled ? Icons.check_circle_outline : Icons.pause_circle_outline),
      title: Text(
        isEnabled ? 'dynamic_wallpaper_enabled'.tr() : 'dynamic_wallpaper_disabled'.tr(),
        style: context.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 4),
          Text(
            'dynamic_wallpaper_status_subtitle'.tr(namedArgs: {'count': selectedCount.toString()}),
            style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceSecondary),
          ),
          if (value != null && selectedCount > 0) ...[
            const SizedBox(height: 4),
            Text(
              'dynamic_wallpaper_preparation_status'.tr(
                namedArgs: {'prepared': value.preparedCount.toString(), 'selected': selectedCount.toString()},
              ),
              style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceSecondary),
            ),
          ],
          if (value != null && value.failedCount > 0) ...[
            const SizedBox(height: 4),
            Text(
              'dynamic_wallpaper_preparation_failed'.tr(namedArgs: {'count': value.failedCount.toString()}),
              style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.error),
            ),
          ],
          if (value?.lastError case final lastError?) ...[
            const SizedBox(height: 4),
            Text(
              'dynamic_wallpaper_last_error'.tr(namedArgs: {'error': lastError}),
              style: context.textTheme.bodySmall?.copyWith(color: context.colorScheme.error),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          if (hasPreparationIssue) ...[
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: Text('dynamic_wallpaper_retry'.tr()),
            ),
          ],
          if (isEnabled) ...[
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: onDisable,
              icon: const Icon(Icons.wallpaper_outlined),
              label: Text('dynamic_wallpaper_disable'.tr()),
            ),
          ],
        ],
      ),
    );
  }
}

class _DynamicWallpaperSelectionTile extends StatelessWidget {
  final List<String> assetIds;
  final Map<String, config_model.DynamicWallpaperAssetLayout> assetLayouts;
  final DynamicWallpaperService service;
  final VoidCallback onSelectionChanged;

  const _DynamicWallpaperSelectionTile({
    required this.assetIds,
    required this.assetLayouts,
    required this.service,
    required this.onSelectionChanged,
  });

  @override
  Widget build(BuildContext context) {
    final selectedCount = assetIds.length;

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      horizontalTitleGap: 20,
      isThreeLine: true,
      leading: const Icon(Icons.photo_library_outlined),
      title: Text(
        'dynamic_wallpaper_selection_title'.tr(),
        style: context.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 4),
          Text(
            'dynamic_wallpaper_selection_subtitle'.tr(namedArgs: {'count': selectedCount.toString()}),
            style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceSecondary),
          ),
          if (assetIds.isNotEmpty) ...[
            const SizedBox(height: 12),
            _DynamicWallpaperSelectionList(
              assetIds: assetIds,
              assetLayouts: assetLayouts,
              service: service,
              onSelectionChanged: onSelectionChanged,
            ),
            const SizedBox(height: 12),
          ],
          OutlinedButton.icon(
            onPressed: selectedCount == 0
                ? null
                : () async {
                    await service.clearSelection();
                    onSelectionChanged();
                  },
            icon: const Icon(Icons.clear_all_outlined),
            label: Text('dynamic_wallpaper_clear_selection'.tr()),
          ),
        ],
      ),
    );
  }
}

class _DynamicWallpaperSelectionList extends StatefulWidget {
  final List<String> assetIds;
  final Map<String, config_model.DynamicWallpaperAssetLayout> assetLayouts;
  final DynamicWallpaperService service;
  final VoidCallback onSelectionChanged;

  const _DynamicWallpaperSelectionList({
    required this.assetIds,
    required this.assetLayouts,
    required this.service,
    required this.onSelectionChanged,
  });

  @override
  State<_DynamicWallpaperSelectionList> createState() => _DynamicWallpaperSelectionListState();
}

class _DynamicWallpaperSelectionListState extends State<_DynamicWallpaperSelectionList> {
  late List<String> _assetIds = [...widget.assetIds];
  late Map<String, config_model.DynamicWallpaperAssetLayout> _assetLayouts = {...widget.assetLayouts};

  @override
  void didUpdateWidget(covariant _DynamicWallpaperSelectionList oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!listEquals(widget.assetIds, _assetIds)) {
      _assetIds = [...widget.assetIds];
    }
    if (!mapEquals(widget.assetLayouts, _assetLayouts)) {
      _assetLayouts = {...widget.assetLayouts};
    }
  }

  Future<void> _reorder(int oldIndex, int newIndex) async {
    final previousAssetIds = [..._assetIds];
    final nextAssetIds = DynamicWallpaperService.reorderAssetIds(_assetIds, oldIndex, newIndex);

    setState(() => _assetIds = nextAssetIds);

    try {
      await widget.service.reorderSelection(oldIndex, newIndex);
      widget.onSelectionChanged();
    } catch (_) {
      if (mounted) {
        setState(() => _assetIds = previousAssetIds);
        ImmichToast.show(context: context, msg: 'dynamic_wallpaper_update_failed'.tr(), toastType: ToastType.error);
      }
    }
  }

  Future<void> _edit(String assetId) async {
    final layout = widget.assetLayouts[assetId] ?? config_model.DynamicWallpaperAssetLayout.identity;
    final nextLayout = await showModalBottomSheet<config_model.DynamicWallpaperAssetLayout>(
      context: context,
      useSafeArea: true,
      isScrollControlled: true,
      backgroundColor: context.colorScheme.surface,
      builder: (context) => _DynamicWallpaperLayoutSheet(assetId: assetId, layout: layout),
    );

    if (nextLayout == null) {
      return;
    }

    try {
      await widget.service.updateLayout(assetId, nextLayout);
      if (mounted) {
        setState(() {
          if (nextLayout.isIdentity) {
            _assetLayouts.remove(assetId);
          } else {
            _assetLayouts[assetId] = nextLayout.normalized();
          }
        });
      }
      widget.onSelectionChanged();
      if (mounted) {
        ImmichToast.show(context: context, msg: 'dynamic_wallpaper_layout_saved'.tr());
      }
    } catch (_) {
      if (mounted) {
        ImmichToast.show(context: context, msg: 'dynamic_wallpaper_update_failed'.tr(), toastType: ToastType.error);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget proxyDecorator(Widget child, int _, Animation<double> animation) {
      return AnimatedBuilder(
        animation: animation,
        builder: (context, child) => Material(
          color: context.colorScheme.surfaceContainerHighest,
          shadowColor: context.colorScheme.primary.withValues(alpha: 0.2),
          child: child,
        ),
        child: child,
      );
    }

    return ClipRRect(
      borderRadius: const BorderRadius.all(Radius.circular(12)),
      child: ReorderableListView.builder(
        buildDefaultDragHandles: false,
        primary: false,
        physics: const NeverScrollableScrollPhysics(),
        proxyDecorator: proxyDecorator,
        shrinkWrap: true,
        itemCount: _assetIds.length,
        onReorderItem: _reorder,
        itemBuilder: (context, index) {
          final assetId = _assetIds[index];
          return _DynamicWallpaperSelectionListItem(
            key: ValueKey(assetId),
            assetId: assetId,
            index: index,
            hasLayout: _assetLayouts.containsKey(assetId),
            onEdit: () => _edit(assetId),
            onRemove: () async {
              await widget.service.removeSelection([assetId]);
              widget.onSelectionChanged();
            },
          );
        },
      ),
    );
  }
}

class _DynamicWallpaperSelectionListItem extends StatelessWidget {
  final String assetId;
  final int index;
  final bool hasLayout;
  final VoidCallback onEdit;
  final VoidCallback onRemove;

  const _DynamicWallpaperSelectionListItem({
    super.key,
    required this.assetId,
    required this.index,
    required this.hasLayout,
    required this.onEdit,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(top: index == 0 ? 0 : 8),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: context.colorScheme.surfaceContainerLow,
          borderRadius: const BorderRadius.all(Radius.circular(12)),
          border: Border.all(color: context.colorScheme.surfaceContainerHighest),
        ),
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Row(
            children: [
              _DynamicWallpaperThumbnail(assetId: assetId),
              const SizedBox(width: 12),
              _SelectionOrderBadge(index: index),
              if (hasLayout) ...[
                const SizedBox(width: 8),
                Icon(Icons.crop_rotate_rounded, color: context.colorScheme.primary),
              ],
              const Spacer(),
              DecoratedBox(
                decoration: BoxDecoration(
                  color: context.colorScheme.surface,
                  borderRadius: const BorderRadius.all(Radius.circular(10)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      tooltip: 'dynamic_wallpaper_edit_photo'.tr(),
                      onPressed: onEdit,
                      icon: const Icon(Icons.crop_rotate_rounded),
                    ),
                    IconButton(
                      tooltip: 'dynamic_wallpaper_remove_photo'.tr(),
                      onPressed: onRemove,
                      icon: const Icon(Icons.delete_outline),
                    ),
                    ReorderableDragStartListener(
                      index: index,
                      child: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        child: Icon(Icons.drag_handle_rounded),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SelectionOrderBadge extends StatelessWidget {
  final int index;

  const _SelectionOrderBadge({required this.index});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32,
      height: 32,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: context.colorScheme.primaryContainer,
        borderRadius: const BorderRadius.all(Radius.circular(8)),
      ),
      child: Text(
        '${index + 1}',
        style: context.textTheme.labelLarge?.copyWith(
          color: context.colorScheme.onPrimaryContainer,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _DynamicWallpaperLayoutSheet extends ConsumerStatefulWidget {
  final String assetId;
  final config_model.DynamicWallpaperAssetLayout layout;

  const _DynamicWallpaperLayoutSheet({required this.assetId, required this.layout});

  @override
  ConsumerState<_DynamicWallpaperLayoutSheet> createState() => _DynamicWallpaperLayoutSheetState();
}

class _DynamicWallpaperLayoutSheetState extends ConsumerState<_DynamicWallpaperLayoutSheet>
    with TickerProviderStateMixin {
  late final CropController _cropController;
  late int _rotationDegrees;
  bool _isCropControllerReady = false;
  bool _isCropControllerInitScheduled = false;

  @override
  void initState() {
    super.initState();
    _rotationDegrees = widget.layout.rotationDegrees;
    _cropController = CropController();
    _cropController.crop = _layoutCropToEditorCrop(widget.layout.crop, _rotationDegrees);
  }

  @override
  void dispose() {
    _cropController.dispose();
    super.dispose();
  }

  void _rotate(int delta) {
    if (!_isCropControllerReady) {
      return;
    }

    setState(() {
      _rotationDegrees = ((_rotationDegrees + delta) % 360 + 360) % 360;
      _cropController.aspectRatio = _editorAspectRatio(context, _rotationDegrees);
    });
  }

  void _reset() {
    if (!_isCropControllerReady) {
      return;
    }

    setState(() {
      _rotationDegrees = 0;
      _cropController.crop = const Rect.fromLTRB(0, 0, 1, 1);
      _cropController.aspectRatio = _editorAspectRatio(context, _rotationDegrees);
    });
  }

  void _save() {
    if (!_isCropControllerReady) {
      return;
    }

    final layoutCrop = _editorCropToLayoutCrop(_cropController.crop, _rotationDegrees);
    Navigator.of(context).pop(
      config_model.DynamicWallpaperAssetLayout(
        rotationDegrees: _rotationDegrees,
        cropLeft: layoutCrop.left,
        cropTop: layoutCrop.top,
        cropRight: layoutCrop.right,
        cropBottom: layoutCrop.bottom,
      ).normalized(),
    );
  }

  void _scheduleCropControllerInit() {
    if (_isCropControllerReady || _isCropControllerInitScheduled) {
      return;
    }

    _isCropControllerInitScheduled = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _isCropControllerInitScheduled = false;
      if (!mounted || _isCropControllerReady) {
        return;
      }

      if (_cropController.getImage() == null) {
        _scheduleCropControllerInit();
        return;
      }

      _cropController.aspectRatio = _editorAspectRatio(context, _rotationDegrees);
      setState(() => _isCropControllerReady = true);
    });
  }

  double _editorAspectRatio(BuildContext context, int rotationDegrees) {
    final size = MediaQuery.sizeOf(context);
    final screenAspectRatio = size.width / size.height;
    return rotationDegrees % 180 == 0 ? screenAspectRatio : 1 / screenAspectRatio;
  }

  @override
  Widget build(BuildContext context) {
    final asset = ref.watch(_dynamicWallpaperAssetProvider(widget.assetId));

    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.9,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                IconButton(
                  tooltip: 'cancel'.tr(),
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close_rounded),
                ),
                Expanded(
                  child: Text(
                    'dynamic_wallpaper_edit_photo'.tr(),
                    style: context.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                    textAlign: TextAlign.center,
                  ),
                ),
                IconButton(
                  tooltip: 'save'.tr(),
                  onPressed: _isCropControllerReady ? _save : null,
                  icon: const Icon(Icons.done_rounded),
                ),
              ],
            ),
          ),
          Expanded(
            child: asset.when(
              data: (asset) {
                if (asset == null) {
                  return Center(child: Text('dynamic_wallpaper_photo_unavailable'.tr()));
                }

                _scheduleCropControllerInit();

                return LayoutBuilder(
                  builder: (context, constraints) {
                    final image = Image(
                      image: getFullImageProvider(
                        asset,
                        edited: false,
                        size: Size(constraints.maxWidth, constraints.maxHeight),
                      ),
                    );

                    final baseWidth = constraints.maxWidth * 0.9;
                    final baseHeight = constraints.maxHeight * 0.9;

                    return Center(
                      child: AnimatedRotation(
                        turns: _rotationDegrees / 360,
                        duration: const Duration(milliseconds: 200),
                        child: SizedBox(
                          width: _rotationDegrees % 180 == 0 ? baseWidth : baseHeight,
                          height: _rotationDegrees % 180 == 0 ? baseHeight : baseWidth,
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: CropImage(controller: _cropController, image: image, gridColor: Colors.white),
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
              error: (_, _) => Center(child: Text('dynamic_wallpaper_photo_unavailable'.tr())),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            child: Row(
              children: [
                IconButton(
                  tooltip: 'dynamic_wallpaper_rotate_left'.tr(),
                  onPressed: _isCropControllerReady ? () => _rotate(-90) : null,
                  icon: const Icon(Icons.rotate_left_rounded),
                ),
                const SizedBox(width: 8),
                IconButton(
                  tooltip: 'dynamic_wallpaper_rotate_right'.tr(),
                  onPressed: _isCropControllerReady ? () => _rotate(90) : null,
                  icon: const Icon(Icons.rotate_right_rounded),
                ),
                const Spacer(),
                OutlinedButton.icon(
                  onPressed: _isCropControllerReady ? _reset : null,
                  icon: const Icon(Icons.restart_alt_rounded),
                  label: Text('reset'.tr()),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

Rect _editorCropToLayoutCrop(Rect crop, int rotationDegrees) {
  return switch (rotationDegrees % 360) {
    90 => Rect.fromLTRB(1 - crop.bottom, crop.left, 1 - crop.top, crop.right),
    180 => Rect.fromLTRB(1 - crop.right, 1 - crop.bottom, 1 - crop.left, 1 - crop.top),
    270 => Rect.fromLTRB(crop.top, 1 - crop.right, crop.bottom, 1 - crop.left),
    _ => crop,
  };
}

Rect _layoutCropToEditorCrop(Rect crop, int rotationDegrees) {
  return switch (rotationDegrees % 360) {
    90 => Rect.fromLTRB(crop.top, 1 - crop.right, crop.bottom, 1 - crop.left),
    180 => Rect.fromLTRB(1 - crop.right, 1 - crop.bottom, 1 - crop.left, 1 - crop.top),
    270 => Rect.fromLTRB(1 - crop.bottom, crop.left, 1 - crop.top, crop.right),
    _ => crop,
  };
}

class _DynamicWallpaperThumbnail extends ConsumerWidget {
  final String assetId;

  const _DynamicWallpaperThumbnail({required this.assetId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(_dynamicWallpaperAssetProvider(assetId));

    return SizedBox(
      width: 56,
      height: 56,
      child: ClipRRect(
        borderRadius: const BorderRadius.all(Radius.circular(8)),
        child: asset.when(
          data: (asset) => asset == null
              ? Thumbnail.remote(remoteId: assetId, thumbhash: '')
              : Thumbnail.fromAsset(asset: asset, size: const Size.square(112)),
          error: (_, _) => Thumbnail.remote(remoteId: assetId, thumbhash: ''),
          loading: () => ColoredBox(color: context.colorScheme.surfaceContainerHighest),
        ),
      ),
    );
  }
}
