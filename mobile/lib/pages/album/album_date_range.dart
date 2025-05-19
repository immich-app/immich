import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/album/current_album.provider.dart';

class AlbumDateRange extends ConsumerWidget {
  const AlbumDateRange({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(
      currentAlbumProvider.select((album) {
        if (album == null || album.assets.isEmpty) {
          return null;
        }

        final startDate = album.startDate;
        final endDate = album.endDate;
        if (startDate == null || endDate == null) {
          return null;
        }
        return (startDate, endDate, album.shared);
      }),
    );

    if (data == null) {
      return const SizedBox();
    }
    final (startDate, endDate, shared) = data;

    return Padding(
      padding: shared
          ? const EdgeInsets.only(
              left: 16.0,
              bottom: 0.0,
            )
          : const EdgeInsets.only(left: 16.0, bottom: 8.0),
      child: Text(
        _getDateRangeText(startDate, endDate),
        style: context.textTheme.labelLarge,
      ),
    );
  }

  @pragma('vm:prefer-inline')
  String _getDateRangeText(DateTime startDate, DateTime endDate) {
    if (startDate.day == endDate.day &&
        startDate.month == endDate.month &&
        startDate.year == endDate.year) {
      return DateFormat.yMMMd().format(startDate);
    }

    final String startDateText = (startDate.year == endDate.year
            ? DateFormat.MMMd()
            : DateFormat.yMMMd())
        .format(startDate);
    final String endDateText = DateFormat.yMMMd().format(endDate);
    return "$startDateText - $endDateText";
  }
}
