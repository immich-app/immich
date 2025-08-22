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
class DriftUploadDetailPage extends ConsumerWidget {
  const DriftUploadDetailPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final uploadItems = ref.watch(driftBackupProvider.select((state) => state.uploadItems));

    return Scaffold(
      appBar: AppBar(
        title: Text("upload_details".t(context: context)),
        backgroundColor: context.colorScheme.surface,
        elevation: 0,
        scrolledUnderElevation: 1,
      ),
      body: uploadItems.isEmpty ? _buildEmptyState(context) : _buildUploadList(uploadItems),
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

  Widget _buildUploadList(Map<String, DriftUploadStatus> uploadItems) {
    return ListView.separated(
      addAutomaticKeepAlives: true,
      padding: const EdgeInsets.all(16),
      itemCount: uploadItems.length,
      separatorBuilder: (context, index) => const SizedBox(height: 4),
      itemBuilder: (context, index) {
        final item = uploadItems.values.elementAt(index);
        return _buildUploadCard(context, item);
      },
    );
  }

  Widget _buildUploadCard(BuildContext context, DriftUploadStatus item) {
    final isCompleted = item.progress >= 1.0;
    final double progressPercentage = (item.progress * 100).clamp(0, 100);

    return Card(
      elevation: 0,
      color: item.isFailed != null ? context.colorScheme.errorContainer : context.colorScheme.surfaceContainer,
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(16)),
        side: BorderSide(color: context.colorScheme.outline.withValues(alpha: 0.1), width: 1),
      ),
      child: InkWell(
        onTap: () => _showFileDetailDialog(context, item),
        borderRadius: const BorderRadius.all(Radius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      spacing: 4,
                      children: [
                        Text(
                          path.basename(item.filename),
                          style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (item.error != null)
                          Text(
                            item.error!,
                            style: context.textTheme.bodySmall?.copyWith(
                              color: context.colorScheme.onErrorContainer.withValues(alpha: 0.6),
                            ),
                          ),
                        Text(
                          "backup_upload_details_page_more_details".t(context: context),
                          style: context.textTheme.bodySmall?.copyWith(
                            color: context.colorScheme.onSurface.withValues(alpha: 0.6),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  _buildProgressIndicator(
                    context,
                    item.progress,
                    progressPercentage,
                    isCompleted,
                    item.networkSpeedAsString,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProgressIndicator(
    BuildContext context,
    double progress,
    double percentage,
    bool isCompleted,
    String networkSpeedAsString,
  ) {
    return Column(
      children: [
        Stack(
          alignment: AlignmentDirectional.center,
          children: [
            SizedBox(
              width: 36,
              height: 36,
              child: TweenAnimationBuilder(
                tween: Tween<double>(begin: 0.0, end: progress),
                duration: const Duration(milliseconds: 300),
                builder: (context, value, _) => CircularProgressIndicator(
                  backgroundColor: context.colorScheme.outline.withValues(alpha: 0.2),
                  strokeWidth: 3,
                  value: value,
                  color: isCompleted ? context.colorScheme.primary : context.colorScheme.secondary,
                ),
              ),
            ),
            if (isCompleted)
              Icon(Icons.check_circle_rounded, size: 28, color: context.colorScheme.primary)
            else
              Text(
                percentage.toStringAsFixed(0),
                style: context.textTheme.labelSmall?.copyWith(fontWeight: FontWeight.bold, fontSize: 10),
              ),
          ],
        ),
        Text(
          networkSpeedAsString,
          style: context.textTheme.labelSmall?.copyWith(
            color: context.colorScheme.onSurface.withValues(alpha: 0.6),
            fontSize: 10,
          ),
        ),
      ],
    );
  }

  Future<void> _showFileDetailDialog(BuildContext context, DriftUploadStatus item) {
    return showDialog(
      context: context,
      builder: (context) => FileDetailDialog(uploadStatus: item),
    );
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
                  // Thumbnail at the top center
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
                  if (asset != null) ...[
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
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [...children]),
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
            child: Text(
              value,
              style: context.textTheme.labelMedium?.copyWith(),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Future<LocalAsset?> _getAssetDetails(WidgetRef ref, String localAssetId) async {
    try {
      final repository = ref.read(localAssetRepository);
      return await repository.getById(localAssetId);
    } catch (e) {
      return null;
    }
  }
}
