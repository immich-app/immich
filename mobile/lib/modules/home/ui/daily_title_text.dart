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
    var formatDateTemplate = currentYear == groupYear ? 'E, MMM dd' : 'E, MMM dd, yyyy';
    var dateText = DateFormat(formatDateTemplate).format(DateTime.parse(isoDate));
    var isMultiSelectEnable = ref.watch(homePageStateProvider).isMultiSelectEnable;

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.only(top: 29.0, bottom: 29.0, left: 12.0, right: 12.0),
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
              onTap: () {
                if (!isMultiSelectEnable) {
                  ref.watch(homePageStateProvider.notifier).enableMultiSelect(assetGroup);
                } else {
                  ref.watch(homePageStateProvider.notifier).disableMultiSelect();
                }
                print(ref.watch(homePageStateProvider).selectedItems.length);
              },
              child: isMultiSelectEnable
                  ? const Icon(Icons.check_circle_rounded)
                  : const Icon(Icons.check_circle_outline_rounded),
            )
          ],
        ),
      ),
    );
  }
}
