import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/offline_album.provider.dart';

/// Pinned banner sliver that shows the download progress of an album marked
/// as available offline. Renders nothing while the album is not offline or
/// all originals are already downloaded.
class OfflineAlbumBanner extends ConsumerWidget {
  static const double _height = 44;

  final String albumId;

  const OfflineAlbumBanner({super.key, required this.albumId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isOffline = ref.watch(isAlbumOfflineProvider(albumId)).valueOrNull ?? false;
    final progress = ref.watch(offlineAlbumProgressProvider(albumId)).valueOrNull;

    if (!isOffline || progress == null || progress.total == 0 || progress.isComplete) {
      return const SliverToBoxAdapter(child: SizedBox.shrink());
    }

    return SliverPersistentHeader(
      pinned: true,
      delegate: _OfflineAlbumBannerDelegate(
        height: _height,
        child: _OfflineAlbumBannerContent(downloaded: progress.downloaded, total: progress.total),
      ),
    );
  }
}

class _OfflineAlbumBannerDelegate extends SliverPersistentHeaderDelegate {
  final double height;
  final Widget child;

  const _OfflineAlbumBannerDelegate({required this.height, required this.child});

  @override
  double get minExtent => height;

  @override
  double get maxExtent => height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) => child;

  @override
  bool shouldRebuild(covariant _OfflineAlbumBannerDelegate oldDelegate) =>
      height != oldDelegate.height || child != oldDelegate.child;
}

class _OfflineAlbumBannerContent extends StatelessWidget {
  final int downloaded;
  final int total;

  const _OfflineAlbumBannerContent({required this.downloaded, required this.total});

  @override
  Widget build(BuildContext context) {
    final progress = total == 0 ? 0.0 : (downloaded / total).clamp(0.0, 1.0);

    return Material(
      color: context.colorScheme.surfaceContainerHigh,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Icon(Icons.download_for_offline_outlined, size: 20, color: context.colorScheme.primary),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'offline_album_downloading_progress'.t(
                        context: context,
                        args: {'downloaded': downloaded.toString(), 'total': total.toString()},
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SizedBox(
            height: 3,
            child: LinearProgressIndicator(
              value: downloaded == 0 ? null : progress,
              backgroundColor: context.colorScheme.surfaceContainerHighest,
              valueColor: AlwaysStoppedAnimation<Color>(context.colorScheme.primary),
            ),
          ),
        ],
      ),
    );
  }
}
