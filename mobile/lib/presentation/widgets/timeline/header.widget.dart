import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class TimelineHeader extends ConsumerWidget {
  final Bucket bucket;
  final HeaderType header;
  final double height;
  final int offset;

  const TimelineHeader({
    super.key,
    required this.bucket,
    required this.header,
    required this.height,
    required this.offset,
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
  Widget build(BuildContext context, WidgetRef ref) {
    if (bucket is! TimeBucket || header == HeaderType.none) {
      return const SizedBox.shrink();
    }

    final date = (bucket as TimeBucket).date;
    final isMultiSelectEnabled =
        ref.watch(multiSelectProvider.select((s) => s.isEnabled));

    return Padding(
      padding: const EdgeInsets.only(
        top: 2,
        left: 12.0,
        right: 12.0,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          SizedBox(
            height: height,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                if (header == HeaderType.month ||
                    header == HeaderType.monthAndDay)
                  Text(
                    _formatMonth(context, date),
                    style: context.textTheme.labelLarge?.copyWith(fontSize: 24),
                  ),
                if (header == HeaderType.day ||
                    header == HeaderType.monthAndDay)
                  Text(
                    _formatDay(context, date),
                    style: context.textTheme.labelLarge?.copyWith(
                      fontSize: 15,
                    ),
                  ),
              ],
            ),
          ),
          const Spacer(),
          GestureDetector(
            onTap: () => {
              ref
                  .read(multiSelectProvider.notifier)
                  .toggleBucketSelection(offset, bucket.assetCount),
            },
            child: isMultiSelectEnabled
                ? Icon(
                    Icons.check_circle_rounded,
                    size: 26,
                    color: context.primaryColor,
                    semanticLabel: "unselect_all_in"
                        .tr(namedArgs: {"group": date.toString()}),
                  )
                : Icon(
                    Icons.check_circle_outline_rounded,
                    size: 26,
                    color: context.colorScheme.onSurfaceSecondary,
                    semanticLabel: "select_all_in"
                        .tr(namedArgs: {"group": date.toString()}),
                  ),
          ),
        ],
      ),
    );
  }
}
