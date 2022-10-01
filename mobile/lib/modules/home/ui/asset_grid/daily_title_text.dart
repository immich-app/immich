import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/providers/home_page_state.provider.dart';
import 'package:openapi/api.dart';

class DailyTitleText extends ConsumerWidget {
  const DailyTitleText({
    Key? key,
    required this.isoDate,
    required this.multiselectEnabled,
    required this.onSelect,
    required this.onDeselect,
    required this.selected,
  }) : super(key: key);

  final String isoDate;
  final bool multiselectEnabled;
  final Function onSelect;
  final Function onDeselect;
  final bool selected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var currentYear = DateTime.now().year;
    var groupYear = DateTime.parse(isoDate).year;
    var formatDateTemplate = currentYear == groupYear
        ? "daily_title_text_date".tr()
        : "daily_title_text_date_year".tr();
    var dateText =
        DateFormat(formatDateTemplate).format(DateTime.parse(isoDate));

    void handleTitleIconClick() {
      if (selected) {
        onDeselect();
      } else {
        onSelect();
      }
    }

    return Padding(
      padding: const EdgeInsets.only(
        top: 29.0,
        bottom: 29.0,
        left: 12.0,
        right: 12.0,
      ),
      child: Row(
        children: [
          Text(
            dateText,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          const Spacer(),
          GestureDetector(
            onTap: handleTitleIconClick,
            child: multiselectEnabled && selected
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
    );
  }
}
