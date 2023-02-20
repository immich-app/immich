import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/background_service/background.service.dart';
import 'package:intl/intl.dart';

/// This is a simple debug widget which should be removed later on when we are
/// more confident about background sync
class IosDebugInfoTile extends HookConsumerWidget {
  const IosDebugInfoTile({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final futures = [
      ref.read(backgroundServiceProvider)
        .getIOSBackupLastRun(IosBackgroundTask.fetch),
      ref.read(backgroundServiceProvider)
        .getIOSBackupLastRun(IosBackgroundTask.processing),
      ref.read(backgroundServiceProvider)
        .getIOSBackupNumberOfProcesses(),
    ];
    return FutureBuilder<List<dynamic>>(
      future: Future.wait(futures),
      builder: (context, snapshot) {
        String? title;
        String? subtitle;
        if (snapshot.hasData) {
          final results = snapshot.data as List<dynamic>;
          final fetch = results[0] as DateTime?;
          final processing = results[1] as DateTime?;
          final processes = results[2] as int;

          final processOrProcesses = processes == 1 ? 'process' : 'processes';
          final numberOrZero = processes == 0 ? 'No' : processes.toString();
          title = '$numberOrZero background $processOrProcesses queued';

          final df = DateFormat.yMd().add_jm();
          if (fetch == null && processing == null) {
            subtitle = 'No background sync job has run yet';
          } else if (fetch != null && processing == null) {
            subtitle = 'Fetch ran ${df.format(fetch)}';
          } else if (processing != null && fetch == null) {
            subtitle = 'Processing ran ${df.format(processing)}';
          } else {
            final fetchOrProcessing = fetch!.isAfter(processing!)
              ? fetch
              : processing;
            subtitle = 'Last sync ${df.format(fetchOrProcessing)}';
          }
        }

        return AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: ListTile(
            key: ValueKey(title),
            title: Text(title ?? ''),
            subtitle: Text(subtitle ?? ''),
            leading: Icon(
              Icons.bug_report,
              color: Theme.of(context).primaryColor,
            ),
          ),
        );
      },
    );
  }
}

