import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/asset_viewer/image_viewer_page_state.provider.dart';

class DownloadStatusInfo extends ConsumerWidget {
  const DownloadStatusInfo({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final showProgress = ref.watch(
      imageViewerStateProvider.select((state) => state.showProgress),
    );

    final status = ref.watch(
      imageViewerStateProvider.select((state) => state.downloadProgress),
    );

    final timeRemaining = status?.timeRemaining.inSeconds;
    final progress = status != null ? (status.progress * 100).floor() : 0;

    return Positioned(
      bottom: 140,
      left: 16,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: showProgress
            ? SizedBox(
                key: const ValueKey('download_progress'),
                width: MediaQuery.of(context).size.width - 32,
                child: Card(
                  child: ListTile(
                    minVerticalPadding: 24,
                    leading: const Icon(Icons.cloud_download_rounded),
                    title: Text(
                      'Downloading...',
                      style: context.textTheme.labelMedium,
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            backgroundColor: context.colorScheme.onSurface,
                            value: status?.progress,
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              context.colorScheme.primary,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        if (progress != 0)
                          Text(
                            '$progress%',
                            style: context.textTheme.labelSmall,
                          ),
                      ],
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          status?.task.filename ?? 'Unknown file',
                          style: context.textTheme.labelMedium,
                        ),
                        if (timeRemaining != -1 && timeRemaining != null)
                          Text(
                            'Time remaining: $timeRemaining seconds',
                            style: context.textTheme.labelMedium,
                          ),
                      ],
                    ),
                  ),
                ),
              )
            : const SizedBox.shrink(key: ValueKey('no_progress')),
      ),
    );
  }
}
