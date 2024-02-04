import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/album/providers/album_sort_by_options.provider.dart';

class AlbumSortSelector extends ConsumerWidget {
  final List<AlbumSortMode> sortModes;

  const AlbumSortSelector({required this.sortModes, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albumSortMode = ref.watch(albumSortByOptionsProvider);
    final albumSortIsReverse = ref.watch(albumSortOrderProvider);

    List<PopupMenuEntry<AlbumSortMode>> buildOptions(BuildContext ctx) {
      {
        return sortModes.map((option) {
          final selected = albumSortMode == option;
          return PopupMenuItem(
            value: option,
            child: Row(
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 12.0),
                  child: Icon(
                    Icons.check,
                    color: selected ? context.primaryColor : Colors.transparent,
                  ),
                ),
                Text(
                  option.label.tr(),
                  style: TextStyle(
                    color: selected ? context.primaryColor : null,
                    fontSize: 14.0,
                  ),
                ),
              ],
            ),
          );
        }).toList();
      }
    }

    void onSelected(AlbumSortMode mode) {
      final isAlreadySelected = albumSortMode == mode;
      // Switch direction
      if (isAlreadySelected) {
        return ref
            .read(albumSortOrderProvider.notifier)
            .changeSortDirection(!albumSortIsReverse);
      }
      return ref.read(albumSortByOptionsProvider.notifier).changeSortMode(mode);
    }

    return PopupMenuButton(
      position: PopupMenuPosition.over,
      itemBuilder: buildOptions,
      onSelected: onSelected,
      child: Row(
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 5),
            child: Icon(
              albumSortIsReverse
                  ? Icons.arrow_downward_rounded
                  : Icons.arrow_upward_rounded,
              size: 14,
              color: context.primaryColor,
            ),
          ),
          Text(
            albumSortMode.label.tr(),
            style: context.textTheme.labelLarge
                ?.copyWith(color: context.primaryColor),
          ),
        ],
      ),
    );
  }
}
