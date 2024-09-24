import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/asset_viewer/download.provider.dart';

class DownloadStatusInfo extends ConsumerWidget {
  const DownloadStatusInfo({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final showProgress = ref.watch(
      downloadStateProvider.select((state) => state.showProgress),
    );
    // final status = ref.watch(
    //   downloadStateProvider.select((state) => state.tasks),
    // );

    // final progress = status != null ? (status.progress * 100).floor() : 0;

    // onCancelDownload() {
    //   if (status != null) {
    //     ref
    //         .watch(downloadStateProvider.notifier)
    //         .cancelDownload(status.task.taskId);
    //   }
    // }

    // return Positioned(
    //   bottom: 140,
    //   left: 16,
    //   child: AnimatedSwitcher(
    //     duration: const Duration(milliseconds: 300),
    //     child: showProgress
    //         ? SizedBox(
    //             key: const ValueKey('download_progress'),
    //             width: MediaQuery.of(context).size.width - 32,
    //             child: Card(
    //               clipBehavior: Clip.antiAlias,
    //               shape: RoundedRectangleBorder(
    //                 borderRadius: BorderRadius.circular(24),
    //               ),
    //               child: ListTile(
    //                 minVerticalPadding: 24,
    //                 leading: const Icon(Icons.cloud_download_rounded),
    //                 title: Text(
    //                   'Downloading...',
    //                   style: context.textTheme.labelLarge,
    //                 ),
    //                 trailing: Column(
    //                   mainAxisAlignment: MainAxisAlignment.center,
    //                   crossAxisAlignment: CrossAxisAlignment.center,
    //                   children: [
    //                     SizedBox(
    //                       height: 24,
    //                       width: 24,
    //                       child: CircularProgressIndicator(
    //                         backgroundColor:
    //                             context.colorScheme.surfaceContainerHighest,
    //                         value: status?.progress,
    //                         strokeWidth: 2,
    //                         valueColor: AlwaysStoppedAnimation<Color>(
    //                           context.colorScheme.primary,
    //                         ),
    //                       ),
    //                     ),
    //                     const SizedBox(height: 8),
    //                     if (progress != 0)
    //                       Text(
    //                         '$progress%',
    //                         style: context.textTheme.labelMedium,
    //                       ),
    //                   ],
    //                 ),
    //                 subtitle: Column(
    //                   crossAxisAlignment: CrossAxisAlignment.start,
    //                   children: [
    //                     Text(
    //                       status?.task.filename ?? 'Unknown file',
    //                       style: context.textTheme.labelLarge,
    //                     ),
    //                     const SizedBox(height: 8),
    //                     ElevatedButton(
    //                       onPressed: onCancelDownload,
    //                       style: ElevatedButton.styleFrom(
    //                         backgroundColor: context.colorScheme.error,
    //                       ),
    //                       child: const Text("Cancel"),
    //                     ),
    //                   ],
    //                 ),
    //               ),
    //             ),
    //           )
    //         : const SizedBox.shrink(key: ValueKey('no_progress')),
    // ),
    // );

    return const SizedBox.shrink();
  }
}
