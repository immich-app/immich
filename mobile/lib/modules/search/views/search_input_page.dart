import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/search/ui/search_filter/display_option_picker.dart';
import 'package:immich_mobile/modules/search/ui/search_filter/filter_bottom_sheet_scaffold.dart';
import 'package:immich_mobile/modules/search/ui/search_filter/media_type_picker.dart';
import 'package:immich_mobile/modules/search/ui/search_filter/search_filter_chip.dart';
import 'package:immich_mobile/modules/search/ui/search_filter/search_filter_utils.dart';

@RoutePage()
class SearchInputPage extends HookConsumerWidget {
  const SearchInputPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedPlace = useState('');

    search({required bool isSmartSearch}) {}

    showPeoplePicker() {}

    showPlacePicker() {
      showModalBottomSheet(
        context: context,
        builder: (BuildContext context) {
          return const Column(
            children: [
              Text('Select a place'),
            ],
          );
        },
      );
    }

    showCameraPicker() {}

    showDatePicker() {}

    showMediaTypePicker() {
      showFilterBottomSheet(
        context: context,
        child: FilterBottomSheetScaffold(
          title: 'Select media type',
          onSearch: () {},
          onClear: () {},
          child: MediaTypePicker(
            onSelect: (value) {
              debugPrint("Selected media type: $value");
            },
          ),
        ),
      );
    }

    showDisplayOptionPicker() {
      showFilterBottomSheet(
        context: context,
        child: FilterBottomSheetScaffold(
          title: 'Select media type',
          onSearch: () {},
          onClear: () {},
          child: DisplayOptionPicker(
            onSelect: (value) {
              debugPrint("Selected media type: $value");
            },
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () {
            context.router.pop();
          },
        ),
        title: TextField(
          decoration: InputDecoration(
            hintText: 'search_bar_hint'.tr(),
            hintStyle: context.textTheme.bodyLarge?.copyWith(
              color: context.themeData.colorScheme.onSurface.withOpacity(0.75),
            ),
            enabledBorder: const UnderlineInputBorder(
              borderSide: BorderSide(color: Colors.transparent),
            ),
            focusedBorder: const UnderlineInputBorder(
              borderSide: BorderSide(color: Colors.transparent),
            ),
          ),
          onSubmitted: (value) {},
        ),
      ),
      body: ListView(
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 12.0),
            child: SizedBox(
              height: 50,
              child: ListView(
                shrinkWrap: true,
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.only(left: 16),
                children: [
                  SearchFilterChip(onTap: showPeoplePicker, label: 'People'),
                  SearchFilterChip(onTap: showPlacePicker, label: 'Places'),
                  SearchFilterChip(onTap: showCameraPicker, label: 'Camera'),
                  SearchFilterChip(onTap: showDatePicker, label: 'Date'),
                  SearchFilterChip(
                    onTap: showMediaTypePicker,
                    label: 'Media Type',
                  ),
                  SearchFilterChip(
                    onTap: showDisplayOptionPicker,
                    label: 'Display Options',
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
