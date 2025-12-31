import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:cancellation_token_http/http.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/backup.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/storage.provider.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/repositories/upload.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:logging/logging.dart';
import 'package:path/path.dart' as p;

final uploadServiceProvider = Provider((ref) {
  final service = UploadService(
    ref.watch(uploadRepositoryProvider),
    ref.watch(backupRepositoryProvider),
    ref.watch(storageRepositoryProvider),
    ref.watch(localAssetRepository),
    ref.watch(appSettingsServiceProvider),
    ref.watch(assetMediaRepositoryProvider),
  );

  ref.onDispose(service.dispose);
  return service;
});

/// Cloudflare's upload size limit (100MB)
const int kCloudflareMaxUploadSize = 100 * 1024 * 1024;

class UploadService {
  UploadService(
    this._uploadRepository,
    this._backupRepository,
    this._storageRepository,
    this._localAssetRepository,
    this._appSettingsService,
    this._assetMediaRepository,
  ) {
    _uploadRepository.onUploadStatus = _onUploadCallback;
    _uploadRepository.onTaskProgress = _onTaskProgressCallback;
  }

  final UploadRepository _uploadRepository;
  final DriftBackupRepository _backupRepository;
  final StorageRepository _storageRepository;
  final DriftLocalAssetRepository _localAssetRepository;
  final AppSettingsService _appSettingsService;
  final AssetMediaRepository _assetMediaRepository;
  final Logger _logger = Logger('UploadService');

  final StreamController<TaskStatusUpdate> _taskStatusController = StreamController<TaskStatusUpdate>.broadcast();
  final StreamController<TaskProgressUpdate> _taskProgressController = StreamController<TaskProgressUpdate>.broadcast();

  Stream<TaskStatusUpdate> get taskStatusStream => _taskStatusController.stream;
  Stream<TaskProgressUpdate> get taskProgressStream => _taskProgressController.stream;

  bool shouldAbortQueuingTasks = false;
  
  /// List of asset IDs that were skipped due to size limits (for later upload on local network)
  final Set<String> _skippedLargeFiles = {};
  
  /// Get count of skipped large files waiting for local network
  int get skippedLargeFilesCount => _skippedLargeFiles.length;
  
  /// Get the list of skipped large file IDs
  Set<String> get skippedLargeFiles => Set.unmodifiable(_skippedLargeFiles);
  
  // Cache the network type to avoid repeated checks
  bool? _cachedIsLocalNetwork;
  String? _cachedEndpoint;
  
  /// Check if connected to a local/internal network (not through Cloudflare)
  /// Returns true for .local domains, private IPs, and localhost
  bool isOnLocalNetwork() {
    final serverEndpoint = Store.tryGet(StoreKey.serverEndpoint) ?? '';
    
    // Use cached result if endpoint hasn't changed
    if (_cachedEndpoint == serverEndpoint && _cachedIsLocalNetwork != null) {
      return _cachedIsLocalNetwork!;
    }
    _cachedEndpoint = serverEndpoint;
    
    final uri = Uri.tryParse(serverEndpoint);
    if (uri == null) {
      _logger.warning('Could not parse server endpoint: $serverEndpoint');
      _cachedIsLocalNetwork = false;
      return false;
    }
    
    final host = uri.host.toLowerCase();
    _logger.info('Checking network type for host: $host');
    
    // Check for .local domain (mDNS/Bonjour) - like familyvault.local
    if (host.endsWith('.local')) {
      _logger.info('✓ LOCAL NETWORK detected: .local domain ($host)');
      _cachedIsLocalNetwork = true;
      return true;
    }
    
    // Check for localhost
    if (host == 'localhost' || host == '127.0.0.1') {
      _logger.info('✓ LOCAL NETWORK detected: localhost');
      _cachedIsLocalNetwork = true;
      return true;
    }
    
    // Check for private IP ranges
    final ipPattern = RegExp(r'^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$');
    final match = ipPattern.firstMatch(host);
    if (match != null) {
      final first = int.parse(match.group(1)!);
      final second = int.parse(match.group(2)!);
      
      // 10.x.x.x (Class A private)
      if (first == 10) {
        _logger.info('✓ LOCAL NETWORK detected: 10.x.x.x private IP');
        _cachedIsLocalNetwork = true;
        return true;
      }
      // 172.16.x.x - 172.31.x.x (Class B private)
      if (first == 172 && second >= 16 && second <= 31) {
        _logger.info('✓ LOCAL NETWORK detected: 172.16-31.x.x private IP');
        _cachedIsLocalNetwork = true;
        return true;
      }
      // 192.168.x.x (Class C private)
      if (first == 192 && second == 168) {
        _logger.info('✓ LOCAL NETWORK detected: 192.168.x.x private IP');
        _cachedIsLocalNetwork = true;
        return true;
      }
    }
    
    _logger.info('✗ EXTERNAL NETWORK: $host (Cloudflare/external)');
    _cachedIsLocalNetwork = false;
    return false;
  }
  
  /// Force refresh the network type cache (call when network changes)
  void refreshNetworkCache() {
    _cachedIsLocalNetwork = null;
    _cachedEndpoint = null;
    _logger.info('Network cache cleared - will re-detect on next check');
  }
  
  /// Check if a file should be skipped due to Cloudflare size limits
  /// Returns true if file is too large AND we're not on local network
  bool shouldSkipLargeFile(int fileSize) {
    final sizeMB = fileSize / (1024 * 1024);
    
    if (fileSize <= kCloudflareMaxUploadSize) {
      return false; // Small enough for any network
    }
    
    final onLocal = isOnLocalNetwork();
    if (onLocal) {
      _logger.info('Large file (${sizeMB.toStringAsFixed(1)}MB) - OK, on LOCAL network');
      return false; // On local network, can upload any size
    }
    
    _logger.warning('SKIPPING large file (${sizeMB.toStringAsFixed(1)}MB) - '
        'exceeds Cloudflare 100MB limit on EXTERNAL network');
    return true;
  }
  
  /// Clear the list of skipped large files (call when switching to local network)
  void clearSkippedLargeFiles() {
    _skippedLargeFiles.clear();
  }
  
  /// Upload only the previously skipped large files (for when on local network)
  Future<int> uploadSkippedLargeFiles(String userId) async {
    if (_skippedLargeFiles.isEmpty) {
      _logger.info('No skipped large files to upload');
      return 0;
    }
    
    if (!isOnLocalNetwork()) {
      _logger.warning('Not on local network - cannot upload large files');
      return 0;
    }
    
    _logger.info('Uploading ${_skippedLargeFiles.length} previously skipped large files on LOCAL network');
    
    int uploadedCount = 0;
    // Get ALL candidates (including unhashed) so we can find skipped large files
    final candidates = await _backupRepository.getCandidates(userId, onlyHashed: false);
    
    for (final candidate in candidates) {
      if (_skippedLargeFiles.contains(candidate.id)) {
        _logger.info('Uploading large file: ${candidate.name} (was skipped on external network)');
        final task = await getUploadTask(candidate, skipSizeCheck: true);
        if (task != null) {
          await _uploadRepository.enqueueBackground(task);
          _skippedLargeFiles.remove(candidate.id);
          uploadedCount++;
          _logger.info('Queued large file: ${candidate.name}');
        } else {
          _logger.warning('Could not create upload task for large file: ${candidate.name}');
        }
      }
    }
    
    _logger.info('Queued $uploadedCount large files for upload on local network');
    return uploadedCount;
  }

  void _onTaskProgressCallback(TaskProgressUpdate update) {
    if (!_taskProgressController.isClosed) {
      _taskProgressController.add(update);
    }
  }

  void _onUploadCallback(TaskStatusUpdate update) {
    if (!_taskStatusController.isClosed) {
      _taskStatusController.add(update);
    }
    _handleTaskStatusUpdate(update);
  }

  void dispose() {
    _taskStatusController.close();
    _taskProgressController.close();
  }

  Future<List<bool>> enqueueTasks(List<UploadTask> tasks) {
    return _uploadRepository.enqueueBackgroundAll(tasks);
  }

  Future<List<Task>> getActiveTasks(String group) {
    return _uploadRepository.getActiveTasks(group);
  }

  Future<({int total, int remainder, int processing})> getBackupCounts(String userId) {
    return _backupRepository.getAllCounts(userId);
  }

  Future<void> manualBackup(List<LocalAsset> localAssets) async {
    await _storageRepository.clearCache();
    List<UploadTask> tasks = [];
    for (final asset in localAssets) {
      final task = await getUploadTask(
        asset,
        group: kManualUploadGroup,
        priority: 1, // High priority after upload motion photo part
      );
      if (task != null) {
        tasks.add(task);
      }
    }

    if (tasks.isNotEmpty) {
      await enqueueTasks(tasks);
    }
  }

  /// Find backup candidates
  /// Build the upload tasks
  /// Enqueue the tasks
  Future<void> startBackup(String userId, void Function(EnqueueStatus status) onEnqueueTasks) async {
    await _storageRepository.clearCache();

    shouldAbortQueuingTasks = false;

    final candidates = await _backupRepository.getCandidates(userId);
    if (candidates.isEmpty) {
      return;
    }

    const batchSize = 100;
    int count = 0;
    for (int i = 0; i < candidates.length; i += batchSize) {
      if (shouldAbortQueuingTasks) {
        break;
      }

      final batch = candidates.skip(i).take(batchSize).toList();
      List<UploadTask> tasks = [];
      for (final asset in batch) {
        final task = await getUploadTask(asset);
        if (task != null) {
          tasks.add(task);
        }
      }

      if (tasks.isNotEmpty && !shouldAbortQueuingTasks) {
        count += tasks.length;
        await enqueueTasks(tasks);

        onEnqueueTasks(EnqueueStatus(enqueueCount: count, totalCount: candidates.length));
      }
    }
  }

  /// Upload a specific batch of assets immediately.
  /// Used by the parallel pipeline to upload batches as they become available
  /// instead of waiting for all hashing to complete.
  Future<int> uploadBatch(
    List<LocalAsset> assets, {
    void Function(int queued, int total)? onProgress,
  }) async {
    _logger.info('uploadBatch: Starting batch of ${assets.length} assets');
    
    if (shouldAbortQueuingTasks) {
      _logger.warning('uploadBatch: ABORTED - shouldAbortQueuingTasks is true');
      return 0;
    }
    
    if (assets.isEmpty) {
      _logger.info('uploadBatch: No assets to upload');
      return 0;
    }

    List<UploadTask> tasks = [];
    int skipped = 0;
    for (int i = 0; i < assets.length; i++) {
      final asset = assets[i];
      if (shouldAbortQueuingTasks) {
        _logger.warning('uploadBatch: ABORTED during loop at asset $i');
        break;
      }
      final task = await getUploadTask(asset);
      if (task != null) {
        tasks.add(task);
        _logger.fine('uploadBatch: Created task for ${asset.name}');
      } else {
        skipped++;
        _logger.fine('uploadBatch: Skipped ${asset.name} (no task returned)');
      }
    }
    
    _logger.info('uploadBatch: Created ${tasks.length} tasks, skipped $skipped');

    if (tasks.isNotEmpty && !shouldAbortQueuingTasks) {
      _logger.info('uploadBatch: Enqueueing ${tasks.length} tasks...');
      await enqueueTasks(tasks);
      _logger.info('uploadBatch: Enqueued ${tasks.length} tasks successfully');
      onProgress?.call(tasks.length, assets.length);
    }

    return tasks.length;
  }

  /// Get the current count of assets ready for upload (hashed but not uploaded)
  Future<int> getReadyForUploadCount(String userId) async {
    final counts = await _backupRepository.getAllCounts(userId);
    // remainder = total not on server, processing = not hashed yet
    // ready = remainder - processing
    return counts.remainder - counts.processing;
  }

  /// Track cloud-only files that we've identified
  final Set<String> _cloudOnlyFiles = {};
  
  /// Get count of identified cloud-only files
  int get cloudOnlyFilesCount => _cloudOnlyFiles.length;
  
  /// Get a batch of candidates ready for upload.
  /// PRIORITIZES LOCAL FILES - cloud files are processed after.
  Future<List<LocalAsset>> getCandidateBatch(String userId, {int limit = 100}) async {
    _logger.info('getCandidateBatch: Fetching up to $limit candidates');
    
    // Get ALL candidates - don't filter by hash
    // Server will handle deduplication, we just need to upload
    final candidates = await _backupRepository.getCandidates(userId, onlyHashed: false);
    _logger.info('getCandidateBatch: ${candidates.length} total candidates');
    
    if (candidates.isEmpty) {
      return [];
    }
    
    // Separate local vs cloud files for prioritization
    final localFiles = <LocalAsset>[];
    final cloudFiles = <LocalAsset>[];
    
    // Check first batch for local availability
    for (final asset in candidates.take(limit * 3)) {
      if (localFiles.length >= limit) break;
      
      // Quick check if we already know this is cloud-only
      if (_cloudOnlyFiles.contains(asset.id)) {
        cloudFiles.add(asset);
        continue;
      }
      
      final isLocal = await _storageRepository.isAssetLocallyAvailable(asset.id);
      if (isLocal) {
        localFiles.add(asset);
      } else {
        _cloudOnlyFiles.add(asset.id);
        cloudFiles.add(asset);
      }
    }
    
    _logger.info('getCandidateBatch: ${localFiles.length} local, ${cloudFiles.length} cloud');
    
    // Return local files first
    if (localFiles.isNotEmpty) {
      return localFiles.take(limit).toList();
    }
    
    // Only cloud files remain - return them (will be slow)
    if (cloudFiles.isNotEmpty) {
      _logger.info('getCandidateBatch: Processing ${cloudFiles.length} cloud files (SLOW)');
      // For cloud files, just return a smaller batch since they're slow
      return cloudFiles.take((limit / 4).ceil().clamp(1, 10)).toList();
    }
    
    return [];
  }
  
  /// Clear tracked cloud files (call when backup completes or cancelled)
  void clearCloudFileTracking() {
    _cloudOnlyFiles.clear();
  }

  Future<void> startBackupWithHttpClient(String userId, bool hasWifi, CancellationToken token) async {
    await _storageRepository.clearCache();

    shouldAbortQueuingTasks = false;

    final candidates = await _backupRepository.getCandidates(userId);
    if (candidates.isEmpty) {
      return;
    }

    const batchSize = 100;
    for (int i = 0; i < candidates.length; i += batchSize) {
      if (shouldAbortQueuingTasks || token.isCancelled) {
        break;
      }

      final batch = candidates.skip(i).take(batchSize).toList();
      List<UploadTaskWithFile> tasks = [];
      for (final asset in batch) {
        final requireWifi = _shouldRequireWiFi(asset);
        if (requireWifi && !hasWifi) {
          _logger.warning('Skipping upload for ${asset.id} because it requires WiFi');
          continue;
        }

        final task = await _getUploadTaskWithFile(asset);
        if (task != null) {
          tasks.add(task);
        }
      }

      if (tasks.isNotEmpty && !shouldAbortQueuingTasks) {
        await _uploadRepository.backupWithDartClient(tasks, token);
      }
    }
  }

  /// Cancel all ongoing uploads and reset the upload queue
  ///
  /// Return the number of left over tasks in the queue
  Future<int> cancelBackup() async {
    shouldAbortQueuingTasks = true;
    
    // Clear cloud file tracking
    clearCloudFileTracking();

    await _storageRepository.clearCache();
    await _uploadRepository.reset(kBackupGroup);
    await _uploadRepository.deleteDatabaseRecords(kBackupGroup);

    final activeTasks = await _uploadRepository.getActiveTasks(kBackupGroup);
    return activeTasks.length;
  }

  Future<void> resumeBackup() {
    return _uploadRepository.start();
  }
  
  /// Cancel a specific upload task by taskId
  /// Returns true if cancelled successfully
  Future<bool> cancelTaskById(String taskId) async {
    _logger.info('Cancelling task: $taskId');
    return _uploadRepository.cancelTask(taskId);
  }
  
  /// Cancel uploads that are stuck retrying
  /// Returns the number of tasks cancelled
  Future<int> cancelStuckUploads() async {
    final retryingTasks = await _uploadRepository.getRetryingTasks(kBackupGroup);
    _logger.info('Found ${retryingTasks.length} tasks stuck in retry');
    
    int cancelled = 0;
    for (final record in retryingTasks) {
      final success = await _uploadRepository.cancelTask(record.task.taskId);
      if (success) {
        cancelled++;
        _logger.info('Cancelled stuck task: ${record.task.displayName}');
      }
    }
    return cancelled;
  }

  void _handleTaskStatusUpdate(TaskStatusUpdate update) async {
    switch (update.status) {
      case TaskStatus.complete:
        unawaited(_handleLivePhoto(update));

        if (CurrentPlatform.isIOS) {
          try {
            final path = await update.task.filePath();
            await File(path).delete();
          } catch (e) {
            _logger.severe('Error deleting file path for iOS: $e');
          }
        }

        break;

      default:
        break;
    }
  }

  Future<void> _handleLivePhoto(TaskStatusUpdate update) async {
    try {
      if (update.task.metaData.isEmpty || update.task.metaData == '') {
        return;
      }

      final metadata = UploadTaskMetadata.fromJson(update.task.metaData);
      if (!metadata.isLivePhotos) {
        return;
      }

      if (update.responseBody == null || update.responseBody!.isEmpty) {
        return;
      }
      final response = jsonDecode(update.responseBody!);

      final localAsset = await _localAssetRepository.getById(metadata.localAssetId);
      if (localAsset == null) {
        return;
      }

      final uploadTask = await getLivePhotoUploadTask(localAsset, response['id'] as String);

      if (uploadTask == null) {
        return;
      }

      await enqueueTasks([uploadTask]);
    } catch (error, stackTrace) {
      dPrint(() => "Error handling live photo upload task: $error $stackTrace");
    }
  }

  Future<UploadTaskWithFile?> _getUploadTaskWithFile(LocalAsset asset) async {
    final entity = await _storageRepository.getAssetEntityForAsset(asset);
    if (entity == null) {
      return null;
    }

    final file = await _storageRepository.getFileForAsset(asset.id);
    if (file == null) {
      return null;
    }

    final originalFileName = entity.isLivePhoto ? p.setExtension(asset.name, p.extension(file.path)) : asset.name;

    String metadata = UploadTaskMetadata(
      localAssetId: asset.id,
      isLivePhotos: entity.isLivePhoto,
      livePhotoVideoId: '',
    ).toJson();

    return UploadTaskWithFile(
      file: file,
      task: await buildUploadTask(
        file,
        createdAt: asset.createdAt,
        modifiedAt: asset.updatedAt,
        originalFileName: originalFileName,
        deviceAssetId: asset.id,
        metadata: metadata,
        group: "group",
        priority: 0,
        isFavorite: asset.isFavorite,
        requiresWiFi: false,
      ),
    );
  }

  @visibleForTesting
  /// Get upload task for an asset.
  /// If [skipSizeCheck] is false (default), large files (>100MB) will be skipped
  /// when not on a local network to avoid Cloudflare upload limits.
  Future<UploadTask?> getUploadTask(
    LocalAsset asset, {
    String group = kBackupGroup, 
    int? priority,
    bool skipSizeCheck = false,
  }) async {
    _logger.fine('getUploadTask: Getting entity for asset ${asset.name} (${asset.id})');
    final entity = await _storageRepository.getAssetEntityForAsset(asset);
    if (entity == null) {
      _logger.warning('getUploadTask: NO ENTITY for ${asset.name} - file may not be accessible');
      return null;
    }

    File? file;

    /// iOS LivePhoto has two files: a photo and a video.
    /// They are uploaded separately, with video file being upload first, then returned with the assetId
    /// The assetId is then used as a metadata for the photo file upload task.
    ///
    /// We implement two separate upload groups for this, the normal one for the video file
    /// and the higher priority group for the photo file because the video file is already uploaded.
    ///
    /// The cancel operation will only cancel the video group (normal group), the photo group will not
    /// be touched, as the video file is already uploaded.

    _logger.fine('getUploadTask: Getting file for ${asset.name}');
    if (entity.isLivePhoto) {
      file = await _storageRepository.getMotionFileForAsset(asset);
    } else {
      file = await _storageRepository.getFileForAsset(asset.id);
    }

    if (file == null) {
      _logger.warning('getUploadTask: NO FILE for ${asset.name} - file may need to be downloaded from cloud');
      return null;
    }
    
    _logger.fine('getUploadTask: Got file ${file.path} (${file.lengthSync()} bytes)');
    
    // Check if file is too large for external network (Cloudflare limit)
    if (!skipSizeCheck) {
      final fileSize = file.lengthSync();
      if (shouldSkipLargeFile(fileSize)) {
        _skippedLargeFiles.add(asset.id);
        final fileName = await _assetMediaRepository.getOriginalFilename(asset.id) ?? asset.name;
        _logger.info('Skipping large file "$fileName" (${(fileSize / 1024 / 1024).toStringAsFixed(1)}MB) - '
            'will upload when on local network');
        return null;
      }
    }

    final fileName = await _assetMediaRepository.getOriginalFilename(asset.id) ?? asset.name;
    final originalFileName = entity.isLivePhoto ? p.setExtension(fileName, p.extension(file.path)) : fileName;

    String metadata = UploadTaskMetadata(
      localAssetId: asset.id,
      isLivePhotos: entity.isLivePhoto,
      livePhotoVideoId: '',
    ).toJson();

    final requiresWiFi = _shouldRequireWiFi(asset);

    return buildUploadTask(
      file,
      createdAt: asset.createdAt,
      modifiedAt: asset.updatedAt,
      originalFileName: originalFileName,
      deviceAssetId: asset.id,
      metadata: metadata,
      group: group,
      priority: priority,
      isFavorite: asset.isFavorite,
      requiresWiFi: requiresWiFi,
    );
  }

  @visibleForTesting
  Future<UploadTask?> getLivePhotoUploadTask(LocalAsset asset, String livePhotoVideoId) async {
    final entity = await _storageRepository.getAssetEntityForAsset(asset);
    if (entity == null) {
      return null;
    }

    final file = await _storageRepository.getFileForAsset(asset.id);
    if (file == null) {
      return null;
    }

    final fields = {'livePhotoVideoId': livePhotoVideoId};

    final requiresWiFi = _shouldRequireWiFi(asset);
    final originalFileName = await _assetMediaRepository.getOriginalFilename(asset.id) ?? asset.name;

    return buildUploadTask(
      file,
      createdAt: asset.createdAt,
      modifiedAt: asset.updatedAt,
      originalFileName: originalFileName,
      deviceAssetId: asset.id,
      fields: fields,
      group: kBackupLivePhotoGroup,
      priority: 0, // Highest priority to get upload immediately
      isFavorite: asset.isFavorite,
      requiresWiFi: requiresWiFi,
    );
  }

  bool _shouldRequireWiFi(LocalAsset asset) {
    bool requiresWiFi = true;

    if (asset.isVideo && _appSettingsService.getSetting(AppSettingsEnum.useCellularForUploadVideos)) {
      requiresWiFi = false;
    } else if (!asset.isVideo && _appSettingsService.getSetting(AppSettingsEnum.useCellularForUploadPhotos)) {
      requiresWiFi = false;
    }

    return requiresWiFi;
  }

  /// Size threshold for "large" files (50MB) - these get special handling
  static const int _largeFileSizeThreshold = 50 * 1024 * 1024; // 50MB
  
  /// Size threshold for "very large" files (200MB) - even more retries
  static const int _veryLargeFileSizeThreshold = 200 * 1024 * 1024; // 200MB

  Future<UploadTask> buildUploadTask(
    File file, {
    required String group,
    required DateTime createdAt,
    required DateTime modifiedAt,
    Map<String, String>? fields,
    String? originalFileName,
    String? deviceAssetId,
    String? metadata,
    int? priority,
    bool? isFavorite,
    bool requiresWiFi = true,
  }) async {
    final serverEndpoint = Store.get(StoreKey.serverEndpoint);
    final url = Uri.parse('$serverEndpoint/assets').toString();
    final headers = ApiService.getRequestHeaders();
    final deviceId = Store.get(StoreKey.deviceId);
    
    // Determine retry settings based on file size
    // Larger files get more retries since they're more prone to failures
    final fileSize = file.lengthSync();
    final int retries;
    
    if (fileSize >= _veryLargeFileSizeThreshold) {
      // Very large files (200MB+): 8 retries
      retries = 8;
      _logger.info('Very large file (${(fileSize / 1024 / 1024).toStringAsFixed(1)}MB): '
          'Using $retries retries');
    } else if (fileSize >= _largeFileSizeThreshold) {
      // Large files (50-200MB): 5 retries
      retries = 5;
      _logger.info('Large file (${(fileSize / 1024 / 1024).toStringAsFixed(1)}MB): '
          'Using $retries retries');
    } else {
      // Normal files: 3 retries (default)
      retries = 3;
    }    final (baseDirectory, directory, filename) = await Task.split(filePath: file.path);
    final fieldsMap = {
      'filename': originalFileName ?? filename,
      'deviceAssetId': deviceAssetId ?? '',
      'deviceId': deviceId,
      'fileCreatedAt': createdAt.toUtc().toIso8601String(),
      'fileModifiedAt': modifiedAt.toUtc().toIso8601String(),
      'isFavorite': isFavorite?.toString() ?? 'false',
      'duration': '0',
      if (fields != null) ...fields,
    };

    if (fileSize >= _largeFileSizeThreshold) {
      _logger.info('Large file upload: ${(fileSize / (1024 * 1024)).toStringAsFixed(0)}MB, retries: $retries');
    }
    
    return UploadTask(
      taskId: deviceAssetId,
      displayName: originalFileName ?? filename,
      httpRequestMethod: 'POST',
      url: url,
      headers: headers,
      filename: filename,
      fields: fieldsMap,
      baseDirectory: baseDirectory,
      directory: directory,
      fileField: 'assetData',
      metaData: metadata ?? '',
      group: group,
      requiresWiFi: requiresWiFi,
      priority: priority ?? 5,
      updates: Updates.statusAndProgress,
      retries: retries,
    );
  }
}

class UploadTaskMetadata {
  final String localAssetId;
  final bool isLivePhotos;
  final String livePhotoVideoId;

  const UploadTaskMetadata({required this.localAssetId, required this.isLivePhotos, required this.livePhotoVideoId});

  UploadTaskMetadata copyWith({String? localAssetId, bool? isLivePhotos, String? livePhotoVideoId}) {
    return UploadTaskMetadata(
      localAssetId: localAssetId ?? this.localAssetId,
      isLivePhotos: isLivePhotos ?? this.isLivePhotos,
      livePhotoVideoId: livePhotoVideoId ?? this.livePhotoVideoId,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'localAssetId': localAssetId,
      'isLivePhotos': isLivePhotos,
      'livePhotoVideoId': livePhotoVideoId,
    };
  }

  factory UploadTaskMetadata.fromMap(Map<String, dynamic> map) {
    return UploadTaskMetadata(
      localAssetId: map['localAssetId'] as String,
      isLivePhotos: map['isLivePhotos'] as bool,
      livePhotoVideoId: map['livePhotoVideoId'] as String,
    );
  }

  String toJson() => json.encode(toMap());

  factory UploadTaskMetadata.fromJson(String source) =>
      UploadTaskMetadata.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() =>
      'UploadTaskMetadata(localAssetId: $localAssetId, isLivePhotos: $isLivePhotos, livePhotoVideoId: $livePhotoVideoId)';

  @override
  bool operator ==(covariant UploadTaskMetadata other) {
    if (identical(this, other)) return true;

    return other.localAssetId == localAssetId &&
        other.isLivePhotos == isLivePhotos &&
        other.livePhotoVideoId == livePhotoVideoId;
  }

  @override
  int get hashCode => localAssetId.hashCode ^ isLivePhotos.hashCode ^ livePhotoVideoId.hashCode;
}
