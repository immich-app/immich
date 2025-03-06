import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/providers/search/is_searching.provider.dart';
import 'package:immich_mobile/providers/search/search_filters.provider.dart';
import 'package:immich_mobile/widgets/search/search_filter/camera_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/filter_bottom_sheet_scaffold.dart';
import 'package:immich_mobile/widgets/search/search_filter/search_filter_chip.dart';
import 'package:immich_mobile/widgets/search/search_filter/search_filter_utils.dart';

class ShowCameraPicker extends ConsumerWidget {
  const ShowCameraPicker({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(searchFiltersProvider);

    showCameraPicker() {
      handleOnSelect(Map<String, String?> value) {
        ref.read(searchFiltersProvider.notifier).camera = SearchCameraFilter(
          make: value['make'],
          model: value['model'],
        );
      }

      handleClear() {
        ref.read(searchFiltersProvider.notifier).value = filter.copyWith(
          camera: const SearchCameraFilter(),
        );
        ref.read(searchFiltersProvider.notifier).search();
      }

      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        isDismissible: true,
        child: FilterBottomSheetScaffold(
          title: 'search_filter_camera_title'.tr(),
          onSearch: () => ref.read(isSearchingProvider.notifier).value = true,
          onClear: handleClear,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: CameraPicker(
              onSelect: handleOnSelect,
              filter: filter.camera,
            ),
          ),
        ),
      );
    }

    return SearchFilterChip(
      icon: Icons.camera_alt_rounded,
      onTap: showCameraPicker,
      label: 'search_filter_camera'.tr(),
      currentFilter: Text(
        '${filter.camera.make ?? ''} ${filter.camera.model ?? ''}',
        style: context.textTheme.labelLarge,
      ),
    );
  }
}
