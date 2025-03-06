import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/search/is_searching.provider.dart';
import 'package:immich_mobile/providers/search/search_filters.provider.dart';
import 'package:immich_mobile/widgets/search/search_filter/filter_bottom_sheet_scaffold.dart';
import 'package:immich_mobile/widgets/search/search_filter/media_type_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/search_filter_chip.dart';
import 'package:immich_mobile/widgets/search/search_filter/search_filter_utils.dart';

class ShowMediaTypePicker extends ConsumerWidget {
  const ShowMediaTypePicker({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mediaType =
        ref.watch(searchFiltersProvider.select((filters) => filters.mediaType));

    showMediaTypePicker() {
      handleOnSelected(AssetType assetType) {
        ref.read(searchFiltersProvider.notifier).mediaType = assetType;
      }

      handleClear() {
        ref.read(searchFiltersProvider.notifier).mediaType = AssetType.other;
        ref.read(searchFiltersProvider.notifier).search();
      }

      showFilterBottomSheet(
        context: context,
        child: FilterBottomSheetScaffold(
          title: 'search_filter_media_type_title'.tr(),
          onSearch: () => ref.read(isSearchingProvider.notifier).value = true,
          onClear: handleClear,
          child: MediaTypePicker(
            onSelect: handleOnSelected,
            filter: mediaType,
          ),
        ),
      );
    }

    return SearchFilterChip(
      icon: Icons.video_collection_outlined,
      onTap: showMediaTypePicker,
      label: 'search_filter_media_type'.tr(),
      currentFilter: Text(
        getFormattedText(mediaType),
        style: context.textTheme.labelLarge,
      ),
    );
  }

  String getFormattedText(AssetType mediaType) {
    switch (mediaType) {
      case AssetType.image:
        return 'search_filter_media_type_image'.tr();
      case AssetType.video:
        return 'search_filter_media_type_video'.tr();
      default:
        return 'search_filter_media_type_all'.tr();
    }
  }
}
