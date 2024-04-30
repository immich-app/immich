import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/map/providers/map_state.provider.dart';
import 'package:immich_mobile/modules/map/widgets/map_settings_sheet.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/shared/views/immich_loading_overlay.dart';
import 'package:immich_mobile/utils/selection_handlers.dart';

class MapAppBar extends HookWidget implements PreferredSizeWidget {
  final ValueNotifier<Set<Asset>> selectedAssets;

  const MapAppBar({super.key, required this.selectedAssets});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(top: MediaQuery.paddingOf(context).top + 25),
      child: ValueListenableBuilder(
        valueListenable: selectedAssets,
        builder: (ctx, value, child) => value.isNotEmpty
            ? _SelectionRow(selectedAssets: selectedAssets)
            : _NonSelectionRow(),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(100);
}

class _NonSelectionRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    void onSettingsPressed() {
      showModalBottomSheet(
        elevation: 0.0,
        showDragHandle: true,
        isScrollControlled: true,
        context: context,
        builder: (_) => const MapSettingsSheet(),
      );
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        ElevatedButton(
          onPressed: () => context.popRoute(),
          style: ElevatedButton.styleFrom(
            shape: const CircleBorder(),
          ),
          child: const Icon(Icons.arrow_back_ios_new_rounded),
        ),
        ElevatedButton(
          onPressed: onSettingsPressed,
          style: ElevatedButton.styleFrom(
            shape: const CircleBorder(),
          ),
          child: const Icon(Icons.more_vert_rounded),
        ),
      ],
    );
  }
}

class _SelectionRow extends HookConsumerWidget {
  final ValueNotifier<Set<Asset>> selectedAssets;

  const _SelectionRow({required this.selectedAssets});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isProcessing = useProcessingOverlay();

    Future<void> handleProcessing(
      FutureOr<void> Function() action, [
      bool reloadMarkers = false,
    ]) async {
      isProcessing.value = true;
      await action();
      // Reset state
      selectedAssets.value = {};
      isProcessing.value = false;
      if (reloadMarkers) {
        ref.read(mapStateNotifierProvider.notifier).setRefetchMarkers(true);
      }
    }

    return Row(
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 20),
          child: ElevatedButton.icon(
            onPressed: () => selectedAssets.value = {},
            icon: const Icon(Icons.close_rounded),
            label: Text(
              '${selectedAssets.value.length}',
              style: context.textTheme.titleMedium?.copyWith(
                color: context.colorScheme.onPrimary,
              ),
            ),
          ),
        ),
        Expanded(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              ElevatedButton(
                onPressed: () => handleProcessing(
                  () => handleShareAssets(
                    ref,
                    context,
                    selectedAssets.value.toList(),
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  shape: const CircleBorder(),
                ),
                child: const Icon(Icons.ios_share_rounded),
              ),
              ElevatedButton(
                onPressed: () => handleProcessing(
                  () => handleFavoriteAssets(
                    ref,
                    context,
                    selectedAssets.value.toList(),
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  shape: const CircleBorder(),
                ),
                child: const Icon(Icons.favorite),
              ),
              ElevatedButton(
                onPressed: () => handleProcessing(
                  () => handleArchiveAssets(
                    ref,
                    context,
                    selectedAssets.value.toList(),
                  ),
                  true,
                ),
                style: ElevatedButton.styleFrom(
                  shape: const CircleBorder(),
                ),
                child: const Icon(Icons.archive),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
