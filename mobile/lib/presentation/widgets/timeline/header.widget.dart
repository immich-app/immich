import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/widgets.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class TimelineHeader extends StatelessWidget {
  final Bucket bucket;
  final HeaderType header;
  final double height;

  const TimelineHeader({
    super.key,
    required this.bucket,
    required this.header,
    required this.height,
  });

  String _formatMonth(BuildContext context, DateTime date) {
    final formatter = date.year == DateTime.now().year
        ? DateFormat.MMMM(context.locale.toLanguageTag())
        : DateFormat.yMMMM(context.locale.toLanguageTag());
    return formatter.format(date);
  }

  String _formatDay(BuildContext context, DateTime date) {
    final formatter = DateFormat.yMMMEd(context.locale.toLanguageTag());
    return formatter.format(date);
  }

  @override
  Widget build(BuildContext context) {
    if (bucket is! TimeBucket || header == HeaderType.none) {
      return const SizedBox.shrink();
    }

    final date = (bucket as TimeBucket).date;
    return Container(
      padding: const EdgeInsets.only(left: 10, top: 30, bottom: 10),
      height: height,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          if (header == HeaderType.month || header == HeaderType.monthAndDay)
            Text(
              _formatMonth(context, date),
              style: context.textTheme.labelLarge
                  ?.copyWith(fontSize: 24, fontWeight: FontWeight.w500),
            ),
          if (header == HeaderType.day || header == HeaderType.monthAndDay)
            Text(
              _formatDay(context, date),
              style: context.textTheme.labelLarge
                  ?.copyWith(fontWeight: FontWeight.w500),
            ),
        ],
      ),
    );
  }
}
