import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class TimelineHeader extends ConsumerWidget {
  final Bucket bucket;
  final HeaderType header;
  final double height;
  final int assetOffset;

  const TimelineHeader({
    super.key,
    required this.bucket,
    required this.header,
    required this.height,
    required this.assetOffset,
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

    List<BaseAsset> bucketAssets;
    try {
      bucketAssets = ref
          .watch(timelineServiceProvider)
          .getAssets(assetOffset, bucket.assetCount);
    } catch (e) {
      bucketAssets = <BaseAsset>[];
    }

    final isAllSelected = ref.watch(bucketSelectionProvider(bucketAssets));
    final isMonthHeader =
        header == HeaderType.month || header == HeaderType.monthAndDay;
    final isDayHeader =
        header == HeaderType.day || header == HeaderType.monthAndDay;

    return Padding(
      padding: EdgeInsets.only(
        top: isMonthHeader ? 8.0 : 0.0,
        left: 12.0,
        right: 12.0,
      ),
      child: SizedBox(
        height: height,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            if (isMonthHeader)
              Row(
                children: [
                  Text(
                    _formatMonth(context, date),
                    style: context.textTheme.labelLarge?.copyWith(fontSize: 24),
                  ),
                  const Spacer(),
                  if (header != HeaderType.monthAndDay)
                    _BulkSelectIconButton(
                      isAllSelected: isAllSelected,
                      onPressed: () {
                        ref
                            .read(multiSelectProvider.notifier)
                            .toggleBucketSelection(
                              assetOffset,
                              bucket.assetCount,
                            );
                        ref.read(hapticFeedbackProvider.notifier).heavyImpact();
                      },
                    ),
                ],
              ),
            if (isDayHeader)
              Row(
                children: [
                  Text(
                    _formatDay(context, date),
                    style: context.textTheme.labelLarge?.copyWith(
                      fontSize: 15,
                    ),
                  ),
                  const Spacer(),
                  _BulkSelectIconButton(
                    isAllSelected: isAllSelected,
                    onPressed: () {
                      ref
                          .read(multiSelectProvider.notifier)
                          .toggleBucketSelection(
                            assetOffset,
                            bucket.assetCount,
                          );
                      ref.read(hapticFeedbackProvider.notifier).heavyImpact();
                    },
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class _BulkSelectIconButton extends ConsumerWidget {
  final bool isAllSelected;
  final VoidCallback onPressed;

  const _BulkSelectIconButton({
    required this.isAllSelected,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return IconButton(
      onPressed: onPressed,
      icon: isAllSelected
          ? Icon(
              Icons.check_circle_rounded,
              size: 26,
              color: context.primaryColor,
            )
          : Icon(
              Icons.check_circle_outline_rounded,
              size: 26,
              color: context.colorScheme.onSurfaceSecondary,
            ),
    );
  }
}
