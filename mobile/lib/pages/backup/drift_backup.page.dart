import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/generated/intl_keys.g.dart';
import 'package:immich_mobile/presentation/widgets/backup/backup_toggle_button.widget.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/backup/backup_album.provider.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/providers/sync_status.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/adaptive_throttle.service.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/services/upload.service.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/widgets/backup/backup_info_card.dart';
import 'package:logging/logging.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

@RoutePage()
class DriftBackupPage extends ConsumerStatefulWidget {
  const DriftBackupPage({super.key});

  @override
  ConsumerState<DriftBackupPage> createState() => _DriftBackupPageState();
}

class _DriftBackupPageState extends ConsumerState<DriftBackupPage> {
  bool? syncSuccess;

  @override
  void initState() {
    super.initState();

    WakelockPlus.enable();

    final currentUser = ref.read(currentUserProvider);
    if (currentUser == null) {
      return;
    }

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await ref.read(driftBackupProvider.notifier).getBackupStatus(currentUser.id);

      ref.read(driftBackupProvider.notifier).updateSyncing(true);
      syncSuccess = await ref.read(backgroundSyncProvider).syncRemote();
      ref.read(driftBackupProvider.notifier).updateSyncing(false);

      if (mounted) {
        await ref.read(driftBackupProvider.notifier).getBackupStatus(currentUser.id);
        
        // Auto-upload any skipped large files if now on local network
        unawaited(_autoUploadLargeFilesIfOnLocalNetwork());
      }
    });
  }
  
  /// Automatically upload large files that were skipped when on external network
  /// This runs silently without user intervention - BUT ONLY IF BACKUP IS ENABLED
  Future<void> _autoUploadLargeFilesIfOnLocalNetwork() async {
    // CRITICAL: Check backup toggle first - this is the master switch!
    final isBackupEnabled = ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.enableBackup);
    if (!isBackupEnabled) {
      Logger('DriftBackupPage').fine('Auto-upload skipped - backup toggle is OFF');
      return;
    }
    
    final uploadService = ref.read(uploadServiceProvider);
    final currentUser = ref.read(currentUserProvider);
    
    if (currentUser == null) return;
    
    // Check if we have skipped files AND are now on local network
    if (uploadService.skippedLargeFilesCount > 0 && uploadService.isOnLocalNetwork()) {
      Logger('DriftBackupPage').info(
        'Auto-uploading ${uploadService.skippedLargeFilesCount} large files - now on local network'
      );
      
      final uploaded = await uploadService.uploadSkippedLargeFiles(currentUser.id);
      
      if (uploaded > 0 && mounted) {
        // Silent notification - just update the backup status
        await ref.read(driftBackupProvider.notifier).getBackupStatus(currentUser.id);
      }
    }
  }

  @override
  dispose() {
    super.dispose();
    WakelockPlus.disable();
  }

  @override
  Widget build(BuildContext context) {
    final selectedAlbum = ref
        .watch(backupAlbumProvider)
        .where((album) => album.backupSelection == BackupSelection.selected)
        .toList();

    final error = ref.watch(driftBackupProvider.select((p) => p.error));

    final backupNotifier = ref.read(driftBackupProvider.notifier);
    final backupSyncManager = ref.read(backgroundSyncProvider);

    Future<void> startBackup() async {
      final currentUser = Store.tryGet(StoreKey.currentUser);
      if (currentUser == null) {
        return;
      }

      if (syncSuccess == null) {
        ref.read(driftBackupProvider.notifier).updateSyncing(true);
        syncSuccess = await backupSyncManager.syncRemote();
        ref.read(driftBackupProvider.notifier).updateSyncing(false);
      }

      await backupNotifier.getBackupStatus(currentUser.id);

      if (syncSuccess == false) {
        Logger("DriftBackupPage").warning("Remote sync did not complete successfully, skipping backup");
        return;
      }
      
      final throttleController = ref.read(adaptiveThrottleControllerProvider);
      final uploadService = ref.read(uploadServiceProvider);
      
      // Auto-upload any previously skipped large files if now on local network
      if (uploadService.skippedLargeFilesCount > 0 && uploadService.isOnLocalNetwork()) {
        Logger("DriftBackupPage").info(
          "Auto-uploading ${uploadService.skippedLargeFilesCount} large files - detected local network"
        );
        await uploadService.uploadSkippedLargeFiles(currentUser.id);
      }
      
      // Start hashing in background and uploading in parallel
      // This enables the pipeline where we upload batches as they become hashed
      Logger("DriftBackupPage").info("Starting parallel backup pipeline");
      
      // Start local sync first (required to detect new assets)
      backupNotifier.updatePipelineStatus('Syncing local albums...');
      await backupSyncManager.syncLocal();
      
      // Start hashing in background - don't wait for completion
      // The pipeline will pick up hashed batches as they become available
      // NOTE: For cloud-backed files (Samsung Cloud, iCloud), this downloads
      // each file before hashing - can be SLOW!
      backupNotifier.updatePipelineStatus('Starting hash process (cloud files may be slow)...');
      unawaited(backupSyncManager.hashAssets());
      
      // Give hashing a moment to start
      await Future.delayed(const Duration(seconds: 1));
      
      // Start the parallel pipeline that uploads as batches become available
      await backupNotifier.startParallelBackup(
        currentUser.id,
        throttleController: throttleController,
        onStatusUpdate: (message) {
          Logger("DriftBackupPage").info("Pipeline: $message");
        },
      );
    }

    Future<void> stopBackup() async {
      await backupNotifier.cancel();
    }

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: Text("backup_controller_page_backup".t()),
        leading: IconButton(
          onPressed: () {
            context.maybePop(true);
          },
          splashRadius: 24,
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
        actions: [
          IconButton(
            onPressed: () {
              context.pushRoute(const DriftBackupOptionsRoute());
            },
            icon: const Icon(Icons.settings_outlined),
            tooltip: "backup_options".t(context: context),
          ),
        ],
      ),
      body: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16.0, right: 16, bottom: 32),
            child: ListView(
              children: [
                const SizedBox(height: 8),
                const _BackupAlbumSelectionCard(),
                if (selectedAlbum.isNotEmpty) ...[
                  const _TotalCard(),
                  const _BackupCard(),
                  const _RemainderCard(),
                  const _AdaptiveThrottleCard(),
                  const Divider(),
                  BackupToggleButton(
                    onStart: () async => await startBackup(),
                    onStop: () async {
                      syncSuccess = null;
                      await stopBackup();
                    },
                  ),
                  switch (error) {
                    BackupError.none => const SizedBox.shrink(),
                    BackupError.syncFailed => Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        mainAxisSize: MainAxisSize.max,
                        children: [
                          Icon(Icons.warning_rounded, color: context.colorScheme.error, fill: 1),
                          const SizedBox(width: 8),
                          Text(
                            IntlKeys.backup_error_sync_failed.t(),
                            style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.error),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  },
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BackupAlbumSelectionCard extends ConsumerWidget {
  const _BackupAlbumSelectionCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Widget buildSelectedAlbumName() {
      String text = "backup_controller_page_backup_selected".tr();
      final albums = ref
          .watch(backupAlbumProvider)
          .where((album) => album.backupSelection == BackupSelection.selected)
          .toList();

      if (albums.isNotEmpty) {
        for (var album in albums) {
          if (album.name == "Recent" || album.name == "Recents") {
            text += "${album.name} (${'all'.tr()}), ";
          } else {
            text += "${album.name}, ";
          }
        }

        return Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            text.trim().substring(0, text.length - 2),
            style: context.textTheme.labelLarge?.copyWith(color: context.primaryColor),
          ),
        );
      } else {
        return Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            "backup_controller_page_none_selected".tr(),
            style: context.textTheme.labelLarge?.copyWith(color: context.primaryColor),
          ),
        );
      }
    }

    Widget buildExcludedAlbumName() {
      String text = "backup_controller_page_excluded".tr();
      final albums = ref
          .watch(backupAlbumProvider)
          .where((album) => album.backupSelection == BackupSelection.excluded)
          .toList();

      if (albums.isNotEmpty) {
        for (var album in albums) {
          text += "${album.name}, ";
        }

        return Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            text.trim().substring(0, text.length - 2),
            style: context.textTheme.labelLarge?.copyWith(color: Colors.red[300]),
          ),
        );
      } else {
        return const SizedBox();
      }
    }

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(20)),
        side: BorderSide(color: context.colorScheme.outlineVariant, width: 1),
      ),
      elevation: 0,
      borderOnForeground: false,
      child: ListTile(
        minVerticalPadding: 18,
        title: Text("backup_controller_page_albums", style: context.textTheme.titleMedium).tr(),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "backup_controller_page_to_backup",
                style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceSecondary),
              ).tr(),
              buildSelectedAlbumName(),
              buildExcludedAlbumName(),
            ],
          ),
        ),
        trailing: ElevatedButton(
          onPressed: () async {
            await context.pushRoute(const DriftBackupAlbumSelectionRoute());
            final currentUser = ref.read(currentUserProvider);
            if (currentUser == null) {
              return;
            }
            unawaited(ref.read(driftBackupProvider.notifier).getBackupStatus(currentUser.id));
          },
          child: const Text("select", style: TextStyle(fontWeight: FontWeight.bold)).tr(),
        ),
      ),
    );
  }
}

class _TotalCard extends ConsumerWidget {
  const _TotalCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final totalCount = ref.watch(driftBackupProvider.select((p) => p.totalCount));

    return BackupInfoCard(
      title: "total".tr(),
      subtitle: "backup_controller_page_total_sub".tr(),
      info: totalCount.toString(),
    );
  }
}

class _BackupCard extends ConsumerWidget {
  const _BackupCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final backupCount = ref.watch(driftBackupProvider.select((p) => p.backupCount));
    final syncStatus = ref.watch(syncStatusProvider);

    return BackupInfoCard(
      title: "backup_controller_page_backup".tr(),
      subtitle: "backup_controller_page_backup_sub".tr(),
      info: backupCount.toString(),
      isLoading: syncStatus.isRemoteSyncing,
    );
  }
}

class _RemainderCard extends ConsumerWidget {
  const _RemainderCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final remainderCount = ref.watch(driftBackupProvider.select((p) => p.remainderCount));
    final syncStatus = ref.watch(syncStatusProvider);

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(20)),
        side: BorderSide(color: context.colorScheme.outlineVariant, width: 1),
      ),
      elevation: 0,
      borderOnForeground: false,
      child: Column(
        children: [
          ListTile(
            minVerticalPadding: 18,
            isThreeLine: true,
            title: Text("backup_controller_page_remainder".t(context: context), style: context.textTheme.titleMedium),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 4.0, right: 18.0),
              child: Text(
                "backup_controller_page_remainder_sub".t(context: context),
                style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceSecondary),
              ),
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Stack(
                  children: [
                    Text(
                      remainderCount.toString(),
                      style: context.textTheme.titleLarge?.copyWith(
                        color: context.colorScheme.onSurface.withAlpha(syncStatus.isRemoteSyncing ? 50 : 255),
                      ),
                    ),
                    if (syncStatus.isRemoteSyncing)
                      Positioned.fill(
                        child: Align(
                          alignment: Alignment.center,
                          child: SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: context.colorScheme.onSurface.withAlpha(150),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                Text(
                  "backup_info_card_assets",
                  style: context.textTheme.labelLarge?.copyWith(
                    color: context.colorScheme.onSurface.withAlpha(syncStatus.isRemoteSyncing ? 50 : 255),
                  ),
                ).tr(),
              ],
            ),
          ),
          const Divider(height: 0),
          const _PreparingStatus(),
          const Divider(height: 0),

          ListTile(
            enableFeedback: true,
            visualDensity: VisualDensity.compact,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 0.0),
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.only(bottomLeft: Radius.circular(20), bottomRight: Radius.circular(20)),
            ),
            onTap: () => context.pushRoute(const DriftBackupAssetDetailRoute()),
            title: Text(
              "view_details".t(context: context),
              style: context.textTheme.labelLarge?.copyWith(color: context.colorScheme.onSurface.withAlpha(200)),
            ),
            trailing: Icon(Icons.arrow_forward_ios, size: 16, color: context.colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _PreparingStatus extends ConsumerStatefulWidget {
  const _PreparingStatus();

  @override
  _PreparingStatusState createState() => _PreparingStatusState();
}

class _PreparingStatusState extends ConsumerState {
  Timer? _pollingTimer;

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  void _startPollingIfNeeded() {
    if (_pollingTimer != null) return;

    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      final currentUser = ref.read(currentUserProvider);
      if (currentUser != null && mounted) {
        await ref.read(driftBackupProvider.notifier).getBackupStatus(currentUser.id);

        // Stop polling if processing count reaches 0
        final updatedProcessingCount = ref.read(driftBackupProvider.select((p) => p.processingCount));
        if (updatedProcessingCount == 0) {
          timer.cancel();
          _pollingTimer = null;
        }
      } else {
        timer.cancel();
        _pollingTimer = null;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final syncStatus = ref.watch(syncStatusProvider);
    final remainderCount = ref.watch(driftBackupProvider.select((p) => p.remainderCount));
    final processingCount = ref.watch(driftBackupProvider.select((p) => p.processingCount));
    final readyForUploadCount = remainderCount - processingCount;

    ref.listen<int>(driftBackupProvider.select((p) => p.processingCount), (previous, next) {
      if (next > 0 && _pollingTimer == null) {
        _startPollingIfNeeded();
      } else if (next == 0 && _pollingTimer != null) {
        _pollingTimer?.cancel();
        _pollingTimer = null;
      }
    });

    if (!syncStatus.isHashing) {
      return const SizedBox.shrink();
    }

    return Row(
      children: [
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(left: 1.0),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
              decoration: BoxDecoration(
                color: context.colorScheme.surfaceContainerHigh.withValues(alpha: 0.5),
                shape: BoxShape.rectangle,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        "preparing".t(context: context),
                        style: context.textTheme.labelLarge?.copyWith(
                          color: context.colorScheme.onSurface.withAlpha(200),
                        ),
                      ),
                      const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 1.5)),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    processingCount.toString(),
                    style: context.textTheme.titleMedium?.copyWith(
                      color: context.colorScheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
            decoration: BoxDecoration(color: context.colorScheme.primary.withValues(alpha: 0.1)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  "ready_for_upload".t(context: context),
                  style: context.textTheme.labelLarge?.copyWith(color: context.colorScheme.onSurface.withAlpha(200)),
                ),
                const SizedBox(height: 2),
                Text(
                  readyForUploadCount.toString(),
                  style: context.textTheme.titleMedium?.copyWith(
                    color: context.primaryColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// Card showing adaptive throttle statistics on the backup page
class _AdaptiveThrottleCard extends HookConsumerWidget {
  const _AdaptiveThrottleCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final throttleController = ref.watch(adaptiveThrottleControllerProvider);
    final driftState = ref.watch(driftBackupProvider);
    
    // Get adaptive state from drift backup provider (parallel pipeline) 
    // or fall back to old backup provider state
    final adaptiveState = driftState.adaptiveState;
    
    // Get current values
    final batchSize = adaptiveState?.currentBatchSize ?? throttleController.currentBatchSize;
    final delayMs = adaptiveState?.currentDelayMs ?? throttleController.delayMs;
    
    // Local state for sliders (initialized from current values)
    final batchSlider = useState<double>(batchSize.toDouble());
    final delaySlider = useState<double>(delayMs.toDouble());
    final showSettings = useState(false);
    
    // Sync slider values when throttle controller changes
    useEffect(() {
      batchSlider.value = batchSize.toDouble();
      delaySlider.value = delayMs.toDouble();
      return null;
    }, [batchSize, delayMs]);
    
    // Get pipeline status
    final isPipelineActive = driftState.isPipelineActive;
    final isHashing = driftState.isHashing;
    final processingCount = driftState.processingCount;
    
    // Check for ACTUAL upload activity
    final hasActiveUploads = driftState.uploadItems.isNotEmpty;
    final activeUploadCount = driftState.uploadItems.length;
    final hasQueuedItems = driftState.enqueueCount > 0;
    final remainderCount = driftState.remainderCount;
    final isSyncing = driftState.isSyncing;
    
    // Determine if we're actually active based on real activity
    final isUploading = hasActiveUploads || hasQueuedItems || isPipelineActive;
    final isActive = isUploading || isSyncing || isHashing;
    
    // Build status message based on actual state - prioritize showing real-time queue info
    String statusMessage;
    if (hasActiveUploads) {
      // Show active upload count prominently
      final queueInfo = hasQueuedItems ? ' (${driftState.enqueueCount} queued)' : '';
      statusMessage = 'Uploading $activeUploadCount${queueInfo}';
    } else if (processingCount > 0) {
      // Hashing is happening - show progress
      final hashProgress = remainderCount > 0 
          ? ' (${remainderCount - processingCount}/${remainderCount} ready)' 
          : '';
      statusMessage = 'Hashing $processingCount files$hashProgress';
    } else if (hasQueuedItems) {
      statusMessage = 'Queued: ${driftState.enqueueCount} of $remainderCount';
    } else if (isSyncing) {
      statusMessage = 'Syncing...';
    } else if (remainderCount > 0) {
      // No uploads, no hashing, but files remain - show pipeline status
      final pipelineStatus = driftState.pipelineStatus;
      if (pipelineStatus.isNotEmpty && pipelineStatus != 'Pipeline complete') {
        statusMessage = pipelineStatus;
      } else {
        statusMessage = '$remainderCount ready to upload';
      }
    } else {
      statusMessage = adaptiveState?.statusMessage ?? driftState.pipelineStatus;
      if (statusMessage.isEmpty) {
        statusMessage = 'All backed up!';
      }
    }
    
    final isRecovering = statusMessage.toLowerCase().contains('recover');
    final isAdjusting = statusMessage.toLowerCase().contains('adjust') || 
                        statusMessage.toLowerCase().contains('increas') || 
                        statusMessage.toLowerCase().contains('decreas');
    
    final Color statusColor = isRecovering 
        ? Colors.red 
        : isAdjusting 
            ? Colors.orange 
            : isActive 
                ? context.primaryColor 
                : context.colorScheme.onSurface.withOpacity(0.5);
    
    final IconData statusIcon = isRecovering 
        ? Icons.healing 
        : isAdjusting 
            ? Icons.tune 
            : isActive 
                ? Icons.monitor_heart 
                : Icons.hourglass_empty;
    
    final String statusLabel = isRecovering ? 'RECOVERING' : isAdjusting ? 'ADJUSTING' : isActive ? 'ACTIVE' : 'IDLE';

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(20)),
        side: BorderSide(color: context.colorScheme.outlineVariant, width: 1),
      ),
      elevation: 0,
      borderOnForeground: false,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Icon(Icons.speed, color: context.primaryColor, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Adaptive Upload',
                  style: context.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                // Settings toggle button
                IconButton(
                  icon: Icon(
                    showSettings.value ? Icons.expand_less : Icons.tune,
                    color: context.primaryColor,
                    size: 20,
                  ),
                  onPressed: () => showSettings.value = !showSettings.value,
                  tooltip: 'Adjust settings',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(statusIcon, size: 14, color: statusColor),
                      const SizedBox(width: 4),
                      Text(
                        statusLabel,
                        style: context.textTheme.labelSmall?.copyWith(
                          color: statusColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // Stats row (tappable to open settings)
            GestureDetector(
              onTap: () => showSettings.value = !showSettings.value,
              child: Row(
                children: [
                  // Batch Size
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: context.colorScheme.surfaceContainerHigh.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.inventory_2_outlined, size: 14, color: context.primaryColor),
                              const SizedBox(width: 4),
                              Text(
                                'Batch',
                                style: context.textTheme.labelSmall?.copyWith(
                                  color: context.colorScheme.onSurface.withOpacity(0.6),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '$batchSize',
                            style: context.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: context.primaryColor,
                            ),
                          ),
                          Text(
                            'assets',
                            style: context.textTheme.labelSmall?.copyWith(
                              color: context.colorScheme.onSurface.withOpacity(0.5),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(width: 12),
                  
                  // Delay
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: context.colorScheme.surfaceContainerHigh.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.timer_outlined, size: 14, color: context.primaryColor),
                              const SizedBox(width: 4),
                              Text(
                                'Delay',
                                style: context.textTheme.labelSmall?.copyWith(
                                  color: context.colorScheme.onSurface.withOpacity(0.6),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '$delayMs',
                            style: context.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: context.primaryColor,
                            ),
                          ),
                          Text(
                            'ms',
                            style: context.textTheme.labelSmall?.copyWith(
                              color: context.colorScheme.onSurface.withOpacity(0.5),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            // Adjustable Settings Panel (expandable)
            if (showSettings.value) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: context.colorScheme.surfaceContainerHighest.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: context.primaryColor.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Adjust Upload Speed',
                      style: context.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: context.primaryColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Higher batch = faster, but may cause issues on slow networks',
                      style: context.textTheme.bodySmall?.copyWith(
                        color: context.colorScheme.onSurface.withOpacity(0.6),
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Batch Size Slider
                    Row(
                      children: [
                        Icon(Icons.inventory_2_outlined, size: 16, color: context.primaryColor),
                        const SizedBox(width: 8),
                        Text('Batch Size: ', style: context.textTheme.bodyMedium),
                        Text(
                          '${batchSlider.value.toInt()}',
                          style: context.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: context.primaryColor,
                          ),
                        ),
                        Text(' assets', style: context.textTheme.bodySmall),
                      ],
                    ),
                    Slider(
                      value: batchSlider.value,
                      min: 10,
                      max: 200,
                      divisions: 19,
                      label: '${batchSlider.value.toInt()} assets',
                      onChanged: (value) {
                        batchSlider.value = value;
                      },
                      onChangeEnd: (value) {
                        throttleController.setManualBatchSize(value.toInt());
                      },
                    ),
                    
                    const SizedBox(height: 8),
                    
                    // Delay Slider
                    Row(
                      children: [
                        Icon(Icons.timer_outlined, size: 16, color: context.primaryColor),
                        const SizedBox(width: 8),
                        Text('Delay: ', style: context.textTheme.bodyMedium),
                        Text(
                          '${delaySlider.value.toInt()}',
                          style: context.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: context.primaryColor,
                          ),
                        ),
                        Text(' ms', style: context.textTheme.bodySmall),
                      ],
                    ),
                    Slider(
                      value: delaySlider.value,
                      min: 0,
                      max: 2000,
                      divisions: 20,
                      label: '${delaySlider.value.toInt()} ms',
                      onChanged: (value) {
                        delaySlider.value = value;
                      },
                      onChangeEnd: (value) {
                        throttleController.setManualDelay(value.toInt());
                      },
                    ),
                    
                    const SizedBox(height: 8),
                    
                    // Quick presets
                    Text(
                      'Quick Presets:',
                      style: context.textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _PresetButton(
                          label: 'Slow',
                          subtitle: '20 / 1s',
                          onTap: () {
                            batchSlider.value = 20;
                            delaySlider.value = 1000;
                            throttleController.setManualBatchSize(20);
                            throttleController.setManualDelay(1000);
                          },
                        ),
                        const SizedBox(width: 8),
                        _PresetButton(
                          label: 'Balanced',
                          subtitle: '50 / 300ms',
                          onTap: () {
                            batchSlider.value = 50;
                            delaySlider.value = 300;
                            throttleController.setManualBatchSize(50);
                            throttleController.setManualDelay(300);
                          },
                        ),
                        const SizedBox(width: 8),
                        _PresetButton(
                          label: 'Fast',
                          subtitle: '100 / 100ms',
                          onTap: () {
                            batchSlider.value = 100;
                            delaySlider.value = 100;
                            throttleController.setManualBatchSize(100);
                            throttleController.setManualDelay(100);
                          },
                        ),
                        const SizedBox(width: 8),
                        _PresetButton(
                          label: 'Max',
                          subtitle: '200 / 0ms',
                          onTap: () {
                            batchSlider.value = 200;
                            delaySlider.value = 0;
                            throttleController.setManualBatchSize(200);
                            throttleController.setManualDelay(0);
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
            
            // Network status indicator
            const _NetworkStatusIndicator(),
            
            // Status message - ALWAYS tappable to view upload details
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () {
                context.pushRoute(const DriftUploadDetailRoute());
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: statusColor.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, size: 16, color: statusColor),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        statusMessage.isNotEmpty ? statusMessage : 'Tap to view upload queue',
                        style: context.textTheme.bodySmall?.copyWith(
                          color: statusColor,
                        ),
                      ),
                    ),
                    // Always show chevron
                    Icon(Icons.chevron_right, size: 18, color: statusColor),
                  ],
                ),
              ),
            ),
            
            // Activity status - shown when any backup activity is happening
            if (isActive) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: context.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: context.primaryColor.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.cloud_upload,
                          size: 14,
                          color: context.primaryColor,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Backup Activity',
                          style: context.textTheme.labelMedium?.copyWith(
                            color: context.primaryColor,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const Spacer(),
                        // Upload speed indicator
                        if (driftState.speedFormatted.isNotEmpty) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: Colors.green.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.speed, size: 12, color: Colors.green.shade700),
                                const SizedBox(width: 4),
                                Text(
                                  driftState.speedFormatted,
                                  style: context.textTheme.labelSmall?.copyWith(
                                    color: Colors.green.shade700,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 8),
                    // Pipeline status row - use Wrap to handle overflow
                    Wrap(
                      spacing: 10,
                      runSpacing: 6,
                      children: [
                        _PipelineStatusIndicator(
                          label: 'Active',
                          isActive: hasActiveUploads,
                          count: activeUploadCount,
                          color: hasActiveUploads ? Colors.green : Colors.grey,
                        ),
                        _PipelineStatusIndicator(
                          label: 'Queue',
                          isActive: hasQueuedItems,
                          count: driftState.enqueueCount,
                          color: hasQueuedItems ? Colors.blue : Colors.grey,
                        ),
                        // Show cloud files count (these are slow)
                        Builder(
                          builder: (context) {
                            final cloudCount = ref.watch(uploadServiceProvider).cloudOnlyFilesCount;
                            if (cloudCount > 0) {
                              return _PipelineStatusIndicator(
                                label: 'Cloud',
                                isActive: true,
                                count: cloudCount,
                                color: Colors.orange,
                              );
                            }
                            return const SizedBox.shrink();
                          },
                        ),
                        if (driftState.currentFailedCount > 0)
                          _PipelineStatusIndicator(
                            label: 'Fail',
                            isActive: true,
                            count: driftState.currentFailedCount,
                            color: Colors.red,
                          ),
                      ],
                    ),
                    // Stats row - completed and total uploaded
                    if (driftState.completedCount > 0 || driftState.totalBytesUploaded > 0) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.check_circle, size: 12, color: Colors.green.shade600),
                          const SizedBox(width: 4),
                          Text(
                            '${driftState.completedCount} done',
                            style: context.textTheme.labelSmall?.copyWith(
                              color: Colors.green.shade600,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Icon(Icons.data_usage, size: 12, color: context.colorScheme.onSurface.withOpacity(0.6)),
                          const SizedBox(width: 4),
                          Text(
                            _formatBytes(driftState.totalBytesUploaded),
                            style: context.textTheme.labelSmall?.copyWith(
                              color: context.colorScheme.onSurface.withOpacity(0.6),
                            ),
                          ),
                          const Spacer(),
                          Text(
                            '${driftState.remainderCount} remaining',
                            style: context.textTheme.labelSmall?.copyWith(
                              color: context.colorScheme.onSurface.withOpacity(0.5),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PresetButton extends StatelessWidget {
  final String label;
  final String subtitle;
  final VoidCallback onTap;
  
  const _PresetButton({
    required this.label,
    required this.subtitle,
    required this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          decoration: BoxDecoration(
            color: context.primaryColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: context.primaryColor.withOpacity(0.3)),
          ),
          child: Column(
            children: [
              Text(
                label,
                style: context.textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: context.primaryColor,
                ),
              ),
              Text(
                subtitle,
                style: context.textTheme.labelSmall?.copyWith(
                  color: context.colorScheme.onSurface.withOpacity(0.6),
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NetworkStatusIndicator extends ConsumerWidget {
  const _NetworkStatusIndicator();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final uploadService = ref.watch(uploadServiceProvider);
    final isLocalNetwork = uploadService.isOnLocalNetwork();
    final skippedCount = uploadService.skippedLargeFilesCount;
    final cloudOnlyCount = uploadService.cloudOnlyFilesCount;
    
    // Don't show anything if on local network with no skipped/deferred files
    if (skippedCount == 0 && isLocalNetwork && cloudOnlyCount == 0) {
      return const SizedBox.shrink();
    }
    
    // Show cloud files status if we have deferred cloud files
    if (cloudOnlyCount > 0) {
      return Padding(
        padding: const EdgeInsets.only(top: 12),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.blue.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.blue.withOpacity(0.3)),
          ),
          child: Row(
            children: [
              const Icon(Icons.cloud_queue, size: 20, color: Colors.blue),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$cloudOnlyCount Cloud-Only Files',
                      style: context.textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Must download from Samsung/iCloud first (slow)',
                      style: context.textTheme.bodySmall?.copyWith(
                        color: context.colorScheme.onSurface.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'SLOW',
                  style: context.textTheme.labelSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.blue.shade700,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }
    
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isLocalNetwork 
              ? Colors.green.withOpacity(0.1) 
              : Colors.orange.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isLocalNetwork 
                ? Colors.green.withOpacity(0.3) 
                : Colors.orange.withOpacity(0.3),
          ),
        ),
        child: Row(
          children: [
            Icon(
              isLocalNetwork ? Icons.home : Icons.cloud,
              size: 20,
              color: isLocalNetwork ? Colors.green : Colors.orange,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isLocalNetwork ? 'Local Network' : 'External Network',
                    style: context.textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: isLocalNetwork ? Colors.green : Colors.orange,
                    ),
                  ),
                  const SizedBox(height: 2),
                  if (skippedCount > 0 && !isLocalNetwork)
                    Text(
                      '$skippedCount large file${skippedCount == 1 ? '' : 's'} (>100MB) will auto-upload on local network',
                      style: context.textTheme.bodySmall?.copyWith(
                        color: context.colorScheme.onSurface.withOpacity(0.7),
                      ),
                    )
                  else if (skippedCount > 0 && isLocalNetwork)
                    Text(
                      '$skippedCount large file${skippedCount == 1 ? '' : 's'} queued for upload',
                      style: context.textTheme.bodySmall?.copyWith(
                        color: Colors.green.shade700,
                      ),
                    )
                  else if (!isLocalNetwork)
                    Text(
                      'Large files (>100MB) auto-upload when home',
                      style: context.textTheme.bodySmall?.copyWith(
                        color: context.colorScheme.onSurface.withOpacity(0.6),
                      ),
                    ),
                ],
              ),
            ),
            // Auto indicator
            if (skippedCount > 0)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isLocalNetwork 
                      ? Colors.green.withOpacity(0.2)
                      : Colors.orange.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isLocalNetwork ? Icons.check_circle : Icons.schedule,
                      size: 14,
                      color: isLocalNetwork ? Colors.green : Colors.orange,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      isLocalNetwork ? 'AUTO' : 'WAIT',
                      style: context.textTheme.labelSmall?.copyWith(
                        color: isLocalNetwork ? Colors.green : Colors.orange,
                        fontWeight: FontWeight.bold,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Format bytes to human-readable string
String _formatBytes(int bytes) {
  if (bytes >= 1024 * 1024 * 1024) {
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  } else if (bytes >= 1024 * 1024) {
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  } else if (bytes >= 1024) {
    return '${(bytes / 1024).toStringAsFixed(1)} KB';
  }
  return '$bytes B';
}

class _PipelineStatusIndicator extends StatelessWidget {
  final String label;
  final bool isActive;
  final int count;
  final Color color;
  
  const _PipelineStatusIndicator({
    required this.label,
    required this.isActive,
    required this.count,
    required this.color,
  });
  
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isActive ? color : color.withOpacity(0.3),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          '$label: $count',
          style: context.textTheme.labelSmall?.copyWith(
            color: isActive ? color : context.colorScheme.onSurface.withOpacity(0.5),
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    );
  }
}
