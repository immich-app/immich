import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/utils/bytes_units.dart';
import 'package:path/path.dart' as path;

@RoutePage()
class DriftUploadDetailPage extends ConsumerStatefulWidget {
  const DriftUploadDetailPage({super.key});

  @override
  ConsumerState<DriftUploadDetailPage> createState() => _DriftUploadDetailPageState();
}

class _DriftUploadDetailPageState extends ConsumerState<DriftUploadDetailPage> {
  final List<DriftUploadStatus> _completedItems = [];
  final Set<String> _seenTaskIds = {};
  final Set<String> _failedTaskIds = {};

  @override
  Widget build(BuildContext context) {
    final uploadItems = ref.watch(driftBackupProvider.select((state) => state.uploadItems));
    final iCloudProgress = ref.watch(driftBackupProvider.select((state) => state.iCloudDownloadProgress));

    for (final item in uploadItems.values) {
      if (item.isFailed == true) {
        _failedTaskIds.add(item.taskId);
      }
    }

    _completedItems.removeWhere((item) => _failedTaskIds.contains(item.taskId));

    for (final item in uploadItems.values) {
      if (item.progress >= 1.0 && item.isFailed != true && !_failedTaskIds.contains(item.taskId)) {
        if (!_seenTaskIds.contains(item.taskId)) {
          _seenTaskIds.add(item.taskId);
          _completedItems.insert(0, item);
          if (_completedItems.length > 50) {
            _completedItems.removeLast();
          }
        }
      }
    }

    final uploadingItems = uploadItems.values.where((item) => item.progress < 1.0 && item.isFailed != true).toList();
    final failedItems = uploadItems.values.where((item) => item.isFailed == true).toList();

    final hasContent =
        uploadingItems.isNotEmpty || failedItems.isNotEmpty || iCloudProgress.isNotEmpty || _completedItems.isNotEmpty;

    return Scaffold(
      appBar: AppBar(
        title: Text("upload_details".t(context: context)),
        backgroundColor: context.colorScheme.surface,
        elevation: 0,
        scrolledUnderElevation: 1,
        actions: [
          if (_completedItems.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.clear_all),
              tooltip: "Clear completed",
              onPressed: () {
                setState(() {
                  _completedItems.clear();
                  _seenTaskIds.clear();
                  _failedTaskIds.clear();
                });
              },
            ),
        ],
      ),
      body: !hasContent
          ? _buildEmptyState(context)
          : _buildTwoSectionLayout(context, uploadingItems, failedItems, iCloudProgress, _completedItems),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.cloud_off_rounded, size: 80, color: context.colorScheme.onSurface.withValues(alpha: 0.3)),
          const SizedBox(height: 16),
          Text(
            "no_uploads_in_progress".t(context: context),
            style: context.textTheme.titleMedium?.copyWith(color: context.colorScheme.onSurface.withValues(alpha: 0.6)),
          ),
        ],
      ),
    );
  }

  Widget _buildTwoSectionLayout(
    BuildContext context,
    List<DriftUploadStatus> uploadingItems,
    List<DriftUploadStatus> failedItems,
    Map<String, double> iCloudProgress,
    List<DriftUploadStatus> completedItems,
  ) {
    return CustomScrollView(
      slivers: [
        // iCloud Downloads Section
        if (iCloudProgress.isNotEmpty) ...[
          SliverToBoxAdapter(
            child: _buildSectionHeader(
              context,
              title: "Downloading from iCloud",
              count: iCloudProgress.length,
              color: context.colorScheme.tertiary,
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate((context, index) {
                final entry = iCloudProgress.entries.elementAt(index);
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _buildICloudDownloadCard(context, entry.key, entry.value),
                );
              }, childCount: iCloudProgress.length),
            ),
          ),
        ],

        // Uploading Section
        SliverToBoxAdapter(
          child: _buildSectionHeader(
            context,
            title: "uploading".t(context: context),
            count: uploadingItems.length,
            color: context.colorScheme.primary,
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate((context, index) {
              if (index < uploadingItems.length) {
                final item = uploadingItems[index];
                return _buildCurrentUploadCard(context, item);
              } else {
                return _buildPlaceholderCard(context);
              }
            }, childCount: 3),
          ),
        ),

        // Errors Section
        if (failedItems.isNotEmpty) ...[
          SliverToBoxAdapter(
            child: _buildSectionHeader(
              context,
              title: "errors_text".t(context: context),
              count: failedItems.length,
              color: context.colorScheme.error,
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate((context, index) {
                final item = failedItems[index];
                return Padding(padding: const EdgeInsets.only(bottom: 8), child: _buildErrorCard(context, item));
              }, childCount: failedItems.length),
            ),
          ),
        ],

        // Completed Section
        if (completedItems.isNotEmpty) ...[
          SliverToBoxAdapter(
            child: _buildSectionHeader(
              context,
              title: "completed".t(context: context),
              count: completedItems.length,
              color: Colors.green,
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate((context, index) {
                final item = completedItems[index];
                return Padding(padding: const EdgeInsets.only(bottom: 4), child: _buildCompletedCard(context, item));
              }, childCount: completedItems.length),
            ),
          ),
        ],

        // Bottom padding
        const SliverToBoxAdapter(child: SizedBox(height: 24)),
      ],
    );
  }

  Widget _buildSectionHeader(BuildContext context, {required String title, int? count, required Color color}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600, color: color),
          ),
          const SizedBox(width: 8),
          count != null
              ? Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.15),
                    borderRadius: const BorderRadius.all(Radius.circular(12)),
                  ),
                  child: Text(
                    count.toString(),
                    style: context.textTheme.labelSmall?.copyWith(fontWeight: FontWeight.bold, color: color),
                  ),
                )
              : const SizedBox.shrink(),
        ],
      ),
    );
  }

  Widget _buildICloudDownloadCard(BuildContext context, String assetId, double progress) {
    final double progressPercentage = (progress * 100).clamp(0, 100);

    return Card(
      elevation: 0,
      color: context.colorScheme.tertiaryContainer.withValues(alpha: 0.5),
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(12)),
        side: BorderSide(color: context.colorScheme.tertiary.withValues(alpha: 0.3), width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: context.colorScheme.tertiary.withValues(alpha: 0.2),
                borderRadius: const BorderRadius.all(Radius.circular(8)),
              ),
              child: Icon(Icons.cloud_download_rounded, size: 24, color: context.colorScheme.tertiary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Downloading from iCloud...",
                    style: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    assetId,
                    style: context.textTheme.bodySmall?.copyWith(
                      color: context.colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: const BorderRadius.all(Radius.circular(4)),
                    child: LinearProgressIndicator(
                      value: progress,
                      backgroundColor: context.colorScheme.tertiary.withValues(alpha: 0.2),
                      valueColor: AlwaysStoppedAnimation(context.colorScheme.tertiary),
                      minHeight: 4,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            SizedBox(
              width: 48,
              child: Text(
                "${progressPercentage.toStringAsFixed(0)}%",
                textAlign: TextAlign.right,
                style: context.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: context.colorScheme.tertiary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentUploadCard(BuildContext context, DriftUploadStatus item) {
    final double progressPercentage = (item.progress * 100).clamp(0, 100);
    final isFailed = item.isFailed == true;

    return Card(
      elevation: 0,
      color: isFailed
          ? context.colorScheme.errorContainer
          : context.colorScheme.primaryContainer.withValues(alpha: 0.5),
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(12)),
        side: BorderSide(
          color: isFailed
              ? context.colorScheme.error.withValues(alpha: 0.3)
              : context.colorScheme.primary.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: InkWell(
        onTap: () => _showFileDetailDialog(context, item),
        borderRadius: const BorderRadius.all(Radius.circular(12)),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: SizedBox(
            height: 64,
            child: Row(
              children: [
                _CurrentUploadThumbnail(taskId: item.taskId),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        path.basename(item.filename),
                        style: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        isFailed
                            ? item.error ?? "Upload failed"
                            : "${formatHumanReadableBytes(item.fileSize, 1)} • ${item.networkSpeedAsString}",
                        style: context.textTheme.labelLarge?.copyWith(
                          color: isFailed
                              ? context.colorScheme.error
                              : context.colorScheme.onSurface.withValues(alpha: 0.6),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (!isFailed) ...[
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: const BorderRadius.all(Radius.circular(4)),
                          child: LinearProgressIndicator(
                            value: item.progress,
                            backgroundColor: context.colorScheme.primary.withValues(alpha: 0.2),
                            valueColor: AlwaysStoppedAnimation(context.colorScheme.primary),
                            minHeight: 4,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                SizedBox(
                  width: 48,
                  child: isFailed
                      ? Icon(Icons.error_rounded, color: context.colorScheme.error, size: 28)
                      : Text(
                          "${progressPercentage.toStringAsFixed(0)}%",
                          textAlign: TextAlign.right,
                          style: context.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: context.colorScheme.primary,
                          ),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCompletedCard(BuildContext context, DriftUploadStatus item) {
    return Card(
      elevation: 0,
      color: context.colorScheme.surfaceContainerLow,
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(8)),
        side: BorderSide(color: context.colorScheme.outline.withValues(alpha: 0.1), width: 1),
      ),
      child: InkWell(
        onTap: () => _showFileDetailDialog(context, item),
        borderRadius: const BorderRadius.all(Radius.circular(8)),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: [
              Icon(Icons.check_circle, size: 20, color: Colors.green.shade600),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  path.basename(item.filename),
                  style: context.textTheme.bodySmall,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Text(
                formatHumanReadableBytes(item.fileSize, 1),
                style: context.textTheme.bodySmall?.copyWith(
                  color: context.colorScheme.onSurface.withValues(alpha: 0.5),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildErrorCard(BuildContext context, DriftUploadStatus item) {
    return Card(
      elevation: 0,
      color: context.colorScheme.errorContainer,
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(12)),
        side: BorderSide(color: context.colorScheme.error.withValues(alpha: 0.3), width: 1),
      ),
      child: InkWell(
        onTap: () => _showFileDetailDialog(context, item),
        borderRadius: const BorderRadius.all(Radius.circular(12)),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              _CurrentUploadThumbnail(taskId: item.taskId),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      path.basename(item.filename),
                      style: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.error ?? "Upload failed",
                      style: context.textTheme.bodySmall?.copyWith(color: context.colorScheme.error),
                      maxLines: 4,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Icon(Icons.error_rounded, color: context.colorScheme.error, size: 28),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlaceholderCard(BuildContext context) {
    return Card(
      elevation: 0,
      color: context.colorScheme.surfaceContainerLow.withValues(alpha: 0.5),
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(12)),
        side: BorderSide(color: context.colorScheme.outline.withValues(alpha: 0.1), width: 1, style: BorderStyle.solid),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: SizedBox(
          height: 64,
          child: Row(
            children: [
              SizedBox(
                width: 48,
                height: 48,
                child: Container(
                  decoration: BoxDecoration(
                    color: context.colorScheme.outline.withValues(alpha: 0.1),
                    borderRadius: const BorderRadius.all(Radius.circular(8)),
                  ),
                  child: Icon(
                    Icons.hourglass_empty_rounded,
                    size: 24,
                    color: context.colorScheme.outline.withValues(alpha: 0.3),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 14,
                      width: 120,
                      decoration: BoxDecoration(
                        color: context.colorScheme.outline.withValues(alpha: 0.1),
                        borderRadius: const BorderRadius.all(Radius.circular(4)),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      height: 10,
                      width: 80,
                      decoration: BoxDecoration(
                        color: context.colorScheme.outline.withValues(alpha: 0.08),
                        borderRadius: const BorderRadius.all(Radius.circular(4)),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      height: 4,
                      decoration: BoxDecoration(
                        color: context.colorScheme.outline.withValues(alpha: 0.1),
                        borderRadius: const BorderRadius.all(Radius.circular(4)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              SizedBox(
                width: 48,
                child: Text(
                  "0%",
                  textAlign: TextAlign.right,
                  style: context.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: context.colorScheme.outline.withValues(alpha: 0.3),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _showFileDetailDialog(BuildContext context, DriftUploadStatus item) {
    return showDialog(
      context: context,
      builder: (context) => FileDetailDialog(uploadStatus: item),
    );
  }
}

class _CurrentUploadThumbnail extends ConsumerWidget {
  final String taskId;
  const _CurrentUploadThumbnail({required this.taskId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder<LocalAsset?>(
      future: _getAsset(ref),
      builder: (context, snapshot) {
        return SizedBox(
          width: 48,
          height: 48,
          child: Container(
            decoration: BoxDecoration(
              color: context.colorScheme.primary.withValues(alpha: 0.2),
              borderRadius: const BorderRadius.all(Radius.circular(8)),
            ),
            clipBehavior: Clip.antiAlias,
            child: snapshot.data != null
                ? Thumbnail.fromAsset(asset: snapshot.data!, size: const Size(48, 48), fit: BoxFit.cover)
                : Icon(Icons.image, size: 24, color: context.colorScheme.primary),
          ),
        );
      },
    );
  }

  Future<LocalAsset?> _getAsset(WidgetRef ref) async {
    try {
      return await ref.read(localAssetRepository).getById(taskId);
    } catch (e) {
      return null;
    }
  }
}

class FileDetailDialog extends ConsumerWidget {
  final DriftUploadStatus uploadStatus;
  const FileDetailDialog({super.key, required this.uploadStatus});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AlertDialog(
      insetPadding: const EdgeInsets.all(20),
      backgroundColor: context.colorScheme.surfaceContainerLow,
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(16)),
        side: BorderSide(color: context.colorScheme.outline.withValues(alpha: 0.2), width: 1),
      ),
      title: Row(
        children: [
          Icon(Icons.info_outline, color: context.primaryColor, size: 24),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              "details".t(context: context),
              style: context.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600, color: context.primaryColor),
            ),
          ),
        ],
      ),
      content: SizedBox(
        width: double.maxFinite,
        child: FutureBuilder<LocalAsset?>(
          future: _getAssetDetails(ref, uploadStatus.taskId),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const SizedBox(height: 200, child: Center(child: CircularProgressIndicator()));
            }
            final asset = snapshot.data;
            return SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Center(
                    child: ClipRRect(
                      borderRadius: const BorderRadius.all(Radius.circular(12)),
                      child: Container(
                        width: 128,
                        height: 128,
                        decoration: BoxDecoration(
                          border: Border.all(color: context.colorScheme.outline.withValues(alpha: 0.2), width: 1),
                          borderRadius: const BorderRadius.all(Radius.circular(12)),
                        ),
                        child: asset != null
                            ? Thumbnail.fromAsset(asset: asset, size: const Size(128, 128), fit: BoxFit.cover)
                            : null,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  if (asset != null)
                    _buildInfoSection(context, [
                      _buildInfoRow(context, "filename".t(context: context), path.basename(uploadStatus.filename)),
                      _buildInfoRow(context, "local_id".t(context: context), asset.id),
                      _buildInfoRow(
                        context,
                        "file_size".t(context: context),
                        formatHumanReadableBytes(uploadStatus.fileSize, 2),
                      ),
                      if (asset.width != null) _buildInfoRow(context, "width".t(context: context), "${asset.width}px"),
                      if (asset.height != null)
                        _buildInfoRow(context, "height".t(context: context), "${asset.height}px"),
                      _buildInfoRow(context, "created_at".t(context: context), asset.createdAt.toString()),
                      _buildInfoRow(context, "updated_at".t(context: context), asset.updatedAt.toString()),
                      if (asset.checksum != null)
                        _buildInfoRow(context, "checksum".t(context: context), asset.checksum!),
                    ]),
                ],
              ),
            );
          },
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(
            "close".t(),
            style: TextStyle(fontWeight: FontWeight.w600, color: context.primaryColor),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoSection(BuildContext context, List<Widget> children) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: context.colorScheme.surfaceContainer,
        borderRadius: const BorderRadius.all(Radius.circular(12)),
        border: Border.all(color: context.colorScheme.outline.withValues(alpha: 0.1), width: 1),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
    );
  }

  Widget _buildInfoRow(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              "$label:",
              style: context.textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.w500,
                color: context.colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),
          ),
          Expanded(
            child: Text(value, style: context.textTheme.labelMedium, maxLines: 3, overflow: TextOverflow.ellipsis),
          ),
        ],
      ),
    );
  }

  Future<LocalAsset?> _getAssetDetails(WidgetRef ref, String localAssetId) async {
    try {
      return await ref.read(localAssetRepository).getById(localAssetId);
    } catch (e) {
      return null;
    }
  }
}
