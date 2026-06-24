import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/services/dynamic_wallpaper.service.dart';
import 'package:immich_mobile/widgets/settings/settings_button_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';

final _dynamicWallpaperAssetProvider = FutureProvider.family(
  (ref, String assetId) => ref.watch(assetServiceProvider).getRemoteAsset(assetId),
);

class DynamicWallpaperSettings extends ConsumerWidget {
  const DynamicWallpaperSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appConfigProvider).dynamicWallpaper;
    final service = ref.watch(dynamicWallpaperServiceProvider);
    final selectedCount = config.assetIds.length;

    if (!Platform.isAndroid) {
      return SettingsSubPageScaffold(
        settings: [
          ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 20),
            title: Text('dynamic_wallpaper_settings_title'.tr()),
            subtitle: Text('dynamic_wallpaper_android_only'.tr()),
          ),
        ],
      );
    }

    return SettingsSubPageScaffold(
      showDivider: true,
      settings: [
        SettingsButtonListTile(
          icon: Icons.wallpaper_outlined,
          title: 'dynamic_wallpaper_picker_title'.tr(),
          subtileText: 'dynamic_wallpaper_picker_subtitle'.tr(namedArgs: {'count': selectedCount.toString()}),
          buttonText: 'dynamic_wallpaper_open_picker'.tr(),
          onButtonTap: selectedCount == 0 ? null : service.openPicker,
        ),
        _DynamicWallpaperSelectionTile(
          assetIds: config.assetIds,
          service: service,
        ),
      ],
    );
  }
}

class _DynamicWallpaperSelectionTile extends StatelessWidget {
  final List<String> assetIds;
  final DynamicWallpaperService service;

  const _DynamicWallpaperSelectionTile({
    required this.assetIds,
    required this.service,
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
            _DynamicWallpaperSelectionList(assetIds: assetIds, service: service),
            const SizedBox(height: 12),
          ],
          OutlinedButton.icon(
            onPressed: selectedCount == 0
                ? null
                : () {
                    service.clearSelection();
                  },
            icon: const Icon(Icons.clear_all_outlined),
            label: Text('dynamic_wallpaper_clear_selection'.tr()),
          ),
        ],
      ),
    );
  }
}

class _DynamicWallpaperSelectionList extends StatelessWidget {
  final List<String> assetIds;
  final DynamicWallpaperService service;

  const _DynamicWallpaperSelectionList({
    required this.assetIds,
    required this.service,
  });

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
        itemCount: assetIds.length,
        onReorderItem: (oldIndex, newIndex) {
          service.reorderSelection(oldIndex, newIndex);
        },
        itemBuilder: (context, index) {
          final assetId = assetIds[index];
          return _DynamicWallpaperSelectionListItem(
            key: ValueKey(assetId),
            assetId: assetId,
            index: index,
            onRemove: () {
              service.removeSelection([assetId]);
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
  final VoidCallback onRemove;

  const _DynamicWallpaperSelectionListItem({
    super.key,
    required this.assetId,
    required this.index,
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
