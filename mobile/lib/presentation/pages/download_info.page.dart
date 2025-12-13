import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/pages/common/download_panel.dart';
import 'package:immich_mobile/providers/asset_viewer/download.provider.dart';

@RoutePage()
class DownloadInfoPage extends ConsumerWidget {
  const DownloadInfoPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = ref.watch(downloadStateProvider.select((state) => state.taskProgress)).entries.toList();

    onCancelDownload(String id) {
      ref.watch(downloadStateProvider.notifier).cancelDownload(id);
    }

    return Scaffold(
      appBar: AppBar(
        title: Text("download".t(context: context)),
        actions: [],
      ),
      body: ListView.builder(
        physics: const ClampingScrollPhysics(),
        shrinkWrap: true,
        itemCount: tasks.length,
        itemBuilder: (context, index) {
          final task = tasks[index];
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
            child: DownloadTaskTile(
              progress: task.value.progress,
              fileName: task.value.fileName,
              status: task.value.status,
              onCancelDownload: () => onCancelDownload(task.key),
            ),
          );
        },
      ),
      persistentFooterButtons: [
        OutlinedButton(
          onPressed: () {
            tasks.map((e) => e.key).forEach(onCancelDownload);
          },
          style: OutlinedButton.styleFrom(side: BorderSide(color: context.colorScheme.primary)),
          child: Text(
            'clear_all'.t(context: context),
            style: context.textTheme.labelLarge?.copyWith(color: context.colorScheme.primary),
          ),
        ),
      ],
    );
  }
}
