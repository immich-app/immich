import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/backup/ios_background_settings.provider.dart';

/// This is a simple debug widget which should be removed later on when we are
/// more confident about background sync
class IosDebugInfoTile extends HookConsumerWidget {
  const IosDebugInfoTile({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(iOSBackgroundSettingsProvider);
    if (settings == null) {
      return const SizedBox.shrink();
    }
    final fetch = settings.timeOfLastFetch;
    final processing = settings.timeOfLastProcessing;
    final processes = settings.numberOfBackgroundTasksQueued;

    final String title;
    if (processes == 0) {
      title = 'ios_debug_info_no_processes_queued'.t(context: context);
    } else {
      title = 'ios_debug_info_processes_queued'
          .t(context: context, args: {'count': processes});
    }

    final df = DateFormat.yMd().add_jm();
    final String subtitle;
    if (fetch == null && processing == null) {
      subtitle = 'ios_debug_info_no_sync_yet'.t(context: context);
    } else if (fetch != null && processing == null) {
      subtitle = 'ios_debug_info_fetch_ran_at'
          .t(context: context, args: {'dateTime': df.format(fetch)});
    } else if (processing != null && fetch == null) {
      subtitle = 'ios_debug_info_processing_ran_at'
          .t(context: context, args: {'dateTime': df.format(processing)});
    } else {
      final fetchOrProcessing =
          fetch!.isAfter(processing!) ? fetch : processing;
      subtitle = 'ios_debug_info_last_sync_at'.t(
        context: context,
        args: {'dateTime': df.format(fetchOrProcessing)},
      );
    }

    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(
        title,
        style: TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 14,
          color: context.primaryColor,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(
          fontSize: 14,
        ),
      ),
      leading: Icon(
        Icons.bug_report,
        color: context.primaryColor,
      ),
    );
  }
}
