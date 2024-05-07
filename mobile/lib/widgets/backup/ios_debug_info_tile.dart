import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/backup/ios_background_settings.provider.dart';
import 'package:intl/intl.dart';

/// This is a simple debug widget which should be removed later on when we are
/// more confident about background sync
class IosDebugInfoTile extends HookConsumerWidget {
  final IOSBackgroundSettings settings;
  const IosDebugInfoTile({
    super.key,
    required this.settings,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fetch = settings.timeOfLastFetch;
    final processing = settings.timeOfLastProcessing;
    final processes = settings.numberOfBackgroundTasksQueued;

    final processOrProcesses = processes == 1 ? 'process' : 'processes';
    final numberOrZero = processes == 0 ? 'No' : processes.toString();
    final title = '$numberOrZero background $processOrProcesses queued';

    final df = DateFormat.yMd().add_jm();
    final String subtitle;
    if (fetch == null && processing == null) {
      subtitle = 'No background sync job has run yet';
    } else if (fetch != null && processing == null) {
      subtitle = 'Fetch ran ${df.format(fetch)}';
    } else if (processing != null && fetch == null) {
      subtitle = 'Processing ran ${df.format(processing)}';
    } else {
      final fetchOrProcessing =
          fetch!.isAfter(processing!) ? fetch : processing;
      subtitle = 'Last sync ${df.format(fetchOrProcessing)}';
    }

    return ListTile(
      key: ValueKey(title),
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
