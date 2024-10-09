import 'package:background_downloader/background_downloader.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/asset_viewer/download.provider.dart';

class DownloadPanel extends ConsumerWidget {
  const DownloadPanel({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final showProgress = ref.watch(
      downloadStateProvider.select((state) => state.showProgress),
    );

    final tasks = ref
        .watch(
          downloadStateProvider.select((state) => state.taskProgress),
        )
        .entries
        .toList();

    onCancelDownload(String id) {
      ref.watch(downloadStateProvider.notifier).cancelDownload(id);
    }

    return Positioned(
      bottom: 140,
      left: 16,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: showProgress
            ? ConstrainedBox(
                constraints:
                    BoxConstraints.loose(Size(context.width - 32, 300)),
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: tasks.length,
                  itemBuilder: (context, index) {
                    final task = tasks[index];
                    return DownloadTaskTile(
                      progress: task.value.progress,
                      fileName: task.value.fileName,
                      status: task.value.status,
                      onCancelDownload: () => onCancelDownload(task.key),
                    );
                  },
                ),
              )
            : const SizedBox.shrink(key: ValueKey('no_progress')),
      ),
    );
  }
}

class DownloadTaskTile extends StatelessWidget {
  final double progress;
  final String fileName;
  final TaskStatus status;
  final VoidCallback onCancelDownload;

  const DownloadTaskTile({
    super.key,
    required this.progress,
    required this.fileName,
    required this.status,
    required this.onCancelDownload,
  });

  @override
  Widget build(BuildContext context) {
    final progressPercent = (progress * 100).round();

    getStatusText() {
      switch (status) {
        case TaskStatus.running:
          return 'downloading'.tr();
        case TaskStatus.complete:
          return 'download_complete'.tr();
        case TaskStatus.failed:
          return 'download_failed'.tr();
        case TaskStatus.canceled:
          return 'download_canceled'.tr();
        case TaskStatus.paused:
          return 'download_paused'.tr();
        case TaskStatus.enqueued:
          return 'download_enqueue'.tr();
        case TaskStatus.notFound:
          return 'download_notfound'.tr();
        case TaskStatus.waitingToRetry:
          return 'download_waiting_to_retry'.tr();
      }
    }

    return SizedBox(
      key: const ValueKey('download_progress'),
      width: MediaQuery.of(context).size.width - 32,
      child: Card(
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        child: ListTile(
          minVerticalPadding: 18,
          leading: const Icon(Icons.video_file_outlined),
          title: Text(
            getStatusText(),
            style: context.textTheme.labelLarge,
          ),
          trailing: IconButton(
            icon: Icon(Icons.close, color: context.colorScheme.onError),
            onPressed: onCancelDownload,
            style: ElevatedButton.styleFrom(
              backgroundColor: context.colorScheme.error.withAlpha(200),
            ),
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                fileName,
                style: context.textTheme.labelMedium,
              ),
              Row(
                children: [
                  Expanded(
                    child: LinearProgressIndicator(
                      minHeight: 8.0,
                      value: progress,
                      borderRadius:
                          const BorderRadius.all(Radius.circular(10.0)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '$progressPercent%',
                    style: context.textTheme.labelSmall,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
