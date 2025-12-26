import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/backup/adaptive_state.model.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/widgets/backup/asset_info_table.dart';
import 'package:immich_mobile/widgets/backup/error_chip.dart';
import 'package:immich_mobile/widgets/backup/icloud_download_progress_bar.dart';
import 'package:immich_mobile/widgets/backup/upload_progress_bar.dart';
import 'package:immich_mobile/widgets/backup/upload_stats.dart';

class CurrentUploadingAssetInfoBox extends ConsumerWidget {
  const CurrentUploadingAssetInfoBox({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final backupState = ref.watch(backupProvider);
    final adaptiveState = backupState.adaptiveState;
    final currentBatch = backupState.currentBatchNumber;
    final totalBatches = backupState.totalBatches;
    final statusMessage = backupState.adaptiveStatusMessage;

    return ListTile(
      isThreeLine: true,
      leading: Icon(Icons.image_outlined, color: context.primaryColor, size: 30),
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text("backup_controller_page_uploading_file_info", style: context.textTheme.titleSmall).tr(),
          const BackupErrorChip(),
        ],
      ),
      subtitle: Column(
        children: [
          // Batch progress indicator
          if (totalBatches > 0) _buildBatchProgress(context, currentBatch, totalBatches, adaptiveState),
          if (Platform.isIOS) const IcloudDownloadProgressBar(),
          const BackupUploadProgressBar(),
          const BackupUploadStats(),
          // Adaptive status message
          if (statusMessage != null && statusMessage.isNotEmpty)
            _buildAdaptiveStatus(context, statusMessage, adaptiveState),
          const BackupAssetInfoTable(),
        ],
      ),
    );
  }

  Widget _buildBatchProgress(
    BuildContext context,
    int currentBatch,
    int totalBatches,
    AdaptiveThrottleState? adaptiveState,
  ) {
    final progress = totalBatches > 0 ? currentBatch / totalBatches : 0.0;
    
    return Padding(
      padding: const EdgeInsets.only(top: 8.0, bottom: 4.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Batch $currentBatch of $totalBatches',
                style: context.textTheme.bodySmall?.copyWith(
                  color: context.colorScheme.onSurface.withOpacity(0.7),
                ),
              ),
              if (adaptiveState != null)
                _buildStatusBadge(context, adaptiveState.status),
            ],
          ),
          const SizedBox(height: 4),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: context.colorScheme.surfaceContainerHighest,
              valueColor: AlwaysStoppedAnimation<Color>(
                _getProgressColor(context, adaptiveState?.status),
              ),
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(BuildContext context, AdaptiveStatus status) {
    final (icon, color, label) = switch (status) {
      AdaptiveStatus.initializing => (Icons.hourglass_empty, Colors.grey, 'Starting'),
      AdaptiveStatus.probing => (Icons.speed, Colors.blue, 'Optimizing'),
      AdaptiveStatus.stable => (Icons.check_circle_outline, Colors.green, 'Stable'),
      AdaptiveStatus.accelerating => (Icons.trending_up, Colors.green, 'Speeding up'),
      AdaptiveStatus.decelerating => (Icons.trending_down, Colors.orange, 'Adjusting'),
      AdaptiveStatus.recovering => (Icons.healing, Colors.amber, 'Recovering'),
      AdaptiveStatus.paused => (Icons.pause_circle_outline, Colors.grey, 'Paused'),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: context.textTheme.labelSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAdaptiveStatus(
    BuildContext context,
    String message,
    AdaptiveThrottleState? adaptiveState,
  ) {
    // Only show if there was a recent adjustment
    if (adaptiveState?.lastAdjustmentReason == null) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Icon(
            Icons.auto_awesome,
            size: 14,
            color: context.primaryColor.withOpacity(0.7),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              message,
              style: context.textTheme.bodySmall?.copyWith(
                color: context.colorScheme.onSurface.withOpacity(0.6),
                fontStyle: FontStyle.italic,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Color _getProgressColor(BuildContext context, AdaptiveStatus? status) {
    return switch (status) {
      AdaptiveStatus.accelerating => Colors.green,
      AdaptiveStatus.decelerating => Colors.orange,
      AdaptiveStatus.recovering => Colors.amber,
      _ => context.primaryColor,
    };
  }
}
