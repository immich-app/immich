import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class MonthlyTitleText extends StatelessWidget {
  const MonthlyTitleText({
    Key? key,
    required this.isoDate,
  }) : super(key: key);

  final String isoDate;

  @override
  Widget build(BuildContext context) {
    var monthTitleText = DateFormat("monthly_title_text_date_format".tr()).format(DateTime.parse(isoDate));

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.only(left: 12.0, top: 32),
        child: Text(
          monthTitleText,
          style: TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.bold,
            color: Theme.of(context).primaryColor,
          ),
        ),
      ),
    );
  }
}
