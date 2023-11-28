import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/disable_multi_select_button.dart';
import 'package:immich_mobile/modules/map/ui/map_settings_dialog.dart';

class MapAppBar extends HookWidget implements PreferredSizeWidget {
  final ValueNotifier<bool> selectionEnabled;
  final int selectedAssetsLength;
  final bool isDarkTheme;

  final void Function() onShare;
  final void Function() onFavorite;
  final void Function() onArchive;

  const MapAppBar({
    super.key,
    required this.selectionEnabled,
    required this.selectedAssetsLength,
    required this.onShare,
    required this.onArchive,
    required this.onFavorite,
    this.isDarkTheme = false,
  });

  List<Widget> buildNonSelectionWidgets(BuildContext context) {
    return [
      Padding(
        padding: const EdgeInsets.only(left: 15, top: 15),
        child: ElevatedButton(
          onPressed: () => context.autoPop(),
          style: ElevatedButton.styleFrom(
            shape: const CircleBorder(),
            padding: const EdgeInsets.all(12),
          ),
          child: const Icon(Icons.arrow_back_ios_new_rounded, size: 22),
        ),
      ),
      Padding(
        padding: const EdgeInsets.only(right: 15, top: 15),
        child: ElevatedButton(
          onPressed: () => showDialog(
            context: context,
            builder: (BuildContext _) {
              return const MapSettingsDialog();
            },
          ),
          style: ElevatedButton.styleFrom(
            shape: const CircleBorder(),
            padding: const EdgeInsets.all(12),
          ),
          child: const Icon(Icons.more_vert_rounded, size: 22),
        ),
      ),
    ];
  }

  List<Widget> buildSelectionWidgets() {
    return [
      DisableMultiSelectButton(
        onPressed: () {
          selectionEnabled.value = false;
        },
        selectedItemCount: selectedAssetsLength,
      ),
      Row(
        children: [
          // Share button
          Padding(
            padding: const EdgeInsets.only(top: 15),
            child: ElevatedButton(
              onPressed: onShare,
              style: ElevatedButton.styleFrom(
                shape: const CircleBorder(),
                padding: const EdgeInsets.all(12),
              ),
              child: Icon(
                Platform.isAndroid
                    ? Icons.share_rounded
                    : Icons.ios_share_rounded,
                size: 22,
              ),
            ),
          ),
          // Favorite button
          Padding(
            padding: const EdgeInsets.only(top: 15),
            child: ElevatedButton(
              onPressed: onFavorite,
              style: ElevatedButton.styleFrom(
                shape: const CircleBorder(),
                padding: const EdgeInsets.all(12),
              ),
              child: const Icon(
                Icons.favorite,
                size: 22,
              ),
            ),
          ),
          // Archive Button
          Padding(
            padding: const EdgeInsets.only(right: 10, top: 15),
            child: ElevatedButton(
              onPressed: onArchive,
              style: ElevatedButton.styleFrom(
                shape: const CircleBorder(),
                padding: const EdgeInsets.all(12),
              ),
              child: const Icon(
                Icons.archive,
                size: 22,
              ),
            ),
          ),
        ],
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top + 15),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (!selectionEnabled.value) ...buildNonSelectionWidgets(context),
          if (selectionEnabled.value) ...buildSelectionWidgets(),
        ],
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(100);
}
