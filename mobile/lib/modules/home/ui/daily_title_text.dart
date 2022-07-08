import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/providers/home_page_state.provider.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:intl/intl.dart';

class DailyTitleText extends ConsumerWidget {
  const DailyTitleText({
    Key? key,
    required this.isoDate,
    required this.assetGroup,
  }) : super(key: key);

  final String isoDate;
  final List<ImmichAsset> assetGroup;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var currentYear = DateTime.now().year;
    var groupYear = DateTime.parse(isoDate).year;
    var formatDateTemplate =
        currentYear == groupYear ? "daily_title_text_date".tr() : "daily_title_text_date_year".tr();
    var dateText =
        DateFormat(formatDateTemplate).format(DateTime.parse(isoDate));
    var isMultiSelectEnable =
        ref.watch(homePageStateProvider).isMultiSelectEnable;
    var selectedDateGroup = ref.watch(homePageStateProvider).selectedDateGroup;
    var selectedItems = ref.watch(homePageStateProvider).selectedItems;

    void _handleTitleIconClick() {
      if (isMultiSelectEnable &&
          selectedDateGroup.contains(dateText) &&
          selectedDateGroup.length == 1 &&
          selectedItems.length <= assetGroup.length) {
        // Multi select is active - click again on the icon while it is the only active group -> disable multi select
        ref.watch(homePageStateProvider.notifier).disableMultiSelect();
      } else if (isMultiSelectEnable &&
          selectedDateGroup.contains(dateText) &&
          selectedItems.length != assetGroup.length) {
        // Multi select is active - click again on the icon while it is not the only active group -> remove that group from selected group/items
        ref
            .watch(homePageStateProvider.notifier)
            .removeSelectedDateGroup(dateText);
        ref
            .watch(homePageStateProvider.notifier)
            .removeMultipleSelectedItem(assetGroup);
      } else if (isMultiSelectEnable &&
          selectedDateGroup.contains(dateText) &&
          selectedDateGroup.length > 1) {
        ref
            .watch(homePageStateProvider.notifier)
            .removeSelectedDateGroup(dateText);
        ref
            .watch(homePageStateProvider.notifier)
            .removeMultipleSelectedItem(assetGroup);
      } else if (isMultiSelectEnable && !selectedDateGroup.contains(dateText)) {
        ref
            .watch(homePageStateProvider.notifier)
            .addSelectedDateGroup(dateText);
        ref
            .watch(homePageStateProvider.notifier)
            .addMultipleSelectedItems(assetGroup);
      } else {
        ref
            .watch(homePageStateProvider.notifier)
            .enableMultiSelect(assetGroup.toSet());
        ref
            .watch(homePageStateProvider.notifier)
            .addSelectedDateGroup(dateText);
      }
    }

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.only(
            top: 29.0, bottom: 29.0, left: 12.0, right: 12.0),
        child: Row(
          children: [
            Text(
              dateText,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const Spacer(),
            GestureDetector(
              onTap: _handleTitleIconClick,
              child: isMultiSelectEnable && selectedDateGroup.contains(dateText)
                  ? Icon(
                      Icons.check_circle_rounded,
                      color: Theme.of(context).primaryColor,
                    )
                  : const Icon(
                      Icons.check_circle_outline_rounded,
                      color: Colors.grey,
                    ),
            )
          ],
        ),
      ),
    );
  }
}
