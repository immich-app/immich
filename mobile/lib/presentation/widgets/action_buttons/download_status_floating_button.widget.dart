import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/asset_viewer/download.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class DownloadStatusFloatingButton extends ConsumerWidget {
  const DownloadStatusFloatingButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final shouldShow = ref.watch(downloadStateProvider.select((state) => state.showProgress));
    final itemCount = ref.watch(downloadStateProvider.select((state) => state.taskProgress.length));
    final isDownloading = ref
        .watch(downloadStateProvider.select((state) => state.taskProgress))
        .values
        .where((element) => element.progress != 1)
        .isNotEmpty;

    return shouldShow
        ? FloatingActionButton(
            shape: RoundedRectangleBorder(
              borderRadius: const BorderRadius.all(Radius.circular(16)),
              side: BorderSide(color: context.colorScheme.outlineVariant),
            ),
            backgroundColor: context.colorScheme.surfaceBright,
            onPressed: () {
              context.pushRoute(const DownloadInfoRoute());
            },
            child: Stack(
              alignment: AlignmentDirectional.center,
              children: [
                Badge.count(
                  count: itemCount,
                  backgroundColor: context.colorScheme.primary.withValues(alpha: 1),
                  child: Icon(
                    Icons.downloading_rounded,
                    color: isDownloading ? context.colorScheme.primary : context.logoGreen,
                    size: 28,
                  ),
                ),
                if (isDownloading)
                  const SizedBox(
                    height: 31,
                    width: 31,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      backgroundColor: Colors.transparent,
                      value: null, // Indeterminate progress
                    ),
                  ),
              ],
            ),
          )
        : const SizedBox.shrink();
  }
}
