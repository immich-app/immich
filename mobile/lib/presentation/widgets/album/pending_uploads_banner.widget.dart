import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/album/pending_album_uploads.provider.dart';

/// Pinned banner sliver that surfaces in-flight album uploads directly under
/// the album app bar. Renders nothing while the queue is empty. Tapping the
/// banner opens a bottom sheet with per-asset progress.
class PendingUploadsBanner extends ConsumerWidget {
  static const double _height = 52;

  final String albumId;

  const PendingUploadsBanner({super.key, required this.albumId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pending = ref.watch(pendingAlbumUploadsProvider(albumId));
    if (pending.isEmpty) {
      return const SliverToBoxAdapter(child: SizedBox.shrink());
    }

    final hasFailures = pending.any((p) => p.failed);
    final clamped = pending.map((p) => p.progress.clamp(0.0, 1.0)).toList(growable: false);
    final overallProgress = clamped.isEmpty ? 0.0 : clamped.reduce((a, b) => a + b) / clamped.length;
    final isIndeterminate = overallProgress <= 0.0;

    return SliverPersistentHeader(
      pinned: true,
      delegate: _PendingUploadsBannerDelegate(
        height: _height,
        child: _PendingUploadsBannerContent(
          albumId: albumId,
          previewAsset: pending.first.asset,
          count: pending.length,
          overallProgress: overallProgress,
          isIndeterminate: isIndeterminate,
          hasFailures: hasFailures,
        ),
      ),
    );
  }

  static void _openSheet(BuildContext context, String albumId) {
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      builder: (_) => _PendingUploadsSheet(albumId: albumId),
    );
  }
}

class _PendingUploadsBannerDelegate extends SliverPersistentHeaderDelegate {
  final double height;
  final Widget child;

  const _PendingUploadsBannerDelegate({required this.height, required this.child});

  @override
  double get minExtent => height;

  @override
  double get maxExtent => height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) => child;

  @override
  bool shouldRebuild(covariant _PendingUploadsBannerDelegate oldDelegate) =>
      height != oldDelegate.height || child != oldDelegate.child;
}

class _PendingUploadsBannerContent extends StatelessWidget {
  final String albumId;
  final BaseAsset previewAsset;
  final int count;
  final double overallProgress;
  final bool isIndeterminate;
  final bool hasFailures;

  const _PendingUploadsBannerContent({
    required this.albumId,
    required this.previewAsset,
    required this.count,
    required this.overallProgress,
    required this.isIndeterminate,
    required this.hasFailures,
  });

  @override
  Widget build(BuildContext context) {
    final percentLabel = isIndeterminate ? '' : ' · ${(overallProgress * 100).toInt()}%';
    return Material(
      color: hasFailures ? context.colorScheme.errorContainer : context.colorScheme.surfaceContainerHigh,
      child: InkWell(
        onTap: () => PendingUploadsBanner._openSheet(context, albumId),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: const BorderRadius.all(Radius.circular(4)),
                      child: SizedBox(width: 32, height: 32, child: Thumbnail.fromAsset(asset: previewAsset)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        '${'uploading'.t(context: context)} $count$percentLabel',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
                      ),
                    ),
                    if (hasFailures)
                      Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: Icon(Icons.error_outline, color: context.colorScheme.error, size: 20),
                      ),
                    Icon(Icons.chevron_right_rounded, color: context.colorScheme.onSurfaceVariant),
                  ],
                ),
              ),
            ),
            SizedBox(
              height: 3,
              child: LinearProgressIndicator(
                value: isIndeterminate ? null : overallProgress,
                backgroundColor: context.colorScheme.surfaceContainerHighest,
                valueColor: AlwaysStoppedAnimation<Color>(
                  hasFailures ? context.colorScheme.error : context.colorScheme.primary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PendingUploadsSheet extends ConsumerWidget {
  final String albumId;

  const _PendingUploadsSheet({required this.albumId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pending = ref.watch(pendingAlbumUploadsProvider(albumId));

    // Auto-dismiss when the queue empties.
    if (pending.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (Navigator.of(context).canPop()) {
          Navigator.of(context).pop();
        }
      });
      return const SizedBox.shrink();
    }

    final failedCount = pending.where((p) => p.failed).length;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      '${'uploading'.t(context: context)} (${pending.length})',
                      style: context.textTheme.titleMedium,
                    ),
                  ),
                  if (failedCount > 0)
                    TextButton.icon(
                      onPressed: () => ref.read(pendingAlbumUploadsProvider(albumId).notifier).clearFailed(),
                      icon: const Icon(Icons.clear_rounded, size: 18),
                      label: Text('clear_failed_count'.t(context: context, args: {'count': failedCount})),
                      style: TextButton.styleFrom(foregroundColor: context.colorScheme.error),
                    ),
                ],
              ),
            ),
            SizedBox(
              height: 96,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: pending.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, index) => _PendingUploadTile(entry: pending[index]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PendingUploadTile extends StatelessWidget {
  final PendingAlbumUpload entry;

  const _PendingUploadTile({required this.entry});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: const BorderRadius.all(Radius.circular(8)),
      child: SizedBox(
        width: 96,
        height: 96,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Thumbnail.fromAsset(asset: entry.asset),
            Positioned.fill(
              child: ColoredBox(
                color: entry.failed ? Colors.red.withValues(alpha: 0.6) : Colors.black54,
                child: Center(
                  child: entry.failed
                      ? const Icon(Icons.error_outline, color: Colors.white, size: 28)
                      : SizedBox(
                          width: 32,
                          height: 32,
                          child: CircularProgressIndicator(
                            value: entry.progress > 0 ? entry.progress : null,
                            strokeWidth: 2.5,
                            backgroundColor: Colors.white24,
                            valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
