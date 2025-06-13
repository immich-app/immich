import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/widgets.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class TimelineHeader extends StatelessWidget {
  final Bucket bucket;
  final double height;

  const TimelineHeader({super.key, required this.bucket, required this.height});

  @override
  Widget build(BuildContext context) {
    if (bucket is! TimeBucket) {
      return const SizedBox.shrink();
    }

    final formatter = DateFormat.yMMMMd(context.locale.toLanguageTag());
    final formattedDate = formatter.format((bucket as TimeBucket).date);

    return Container(
      padding: const EdgeInsets.only(left: 10, top: 40),
      height: height,
      child: Text(
        formattedDate,
        style: context.textTheme.displayLarge
            ?.copyWith(fontWeight: FontWeight.w500),
      ),
    );
  }
}
