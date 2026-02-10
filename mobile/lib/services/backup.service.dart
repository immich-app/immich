import 'dart:async';
import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'dart:io';

import 'package:cancellation_token_http/http.dart' as http;
import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/models/backup/backup_candidate.model.dart';
import 'package:immich_mobile/models/backup/current_upload_asset.model.dart';
import 'package:immich_mobile/models/backup/error_upload_asset.model.dart';
import 'package:immich_mobile/models/backup/success_upload_asset.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/repositories/album_media.repository.dart';
import 'package:immich_mobile/repositories/asset.repository.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/repositories/file_media.repository.dart';
import 'package:immich_mobile/services/album.service.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:path/path.dart' as p;
import 'package:permission_handler/permission_handler.dart' as pm;
import 'package:photo_manager/photo_manager.dart' show PMProgressHandler;
import 'package:immich_mobile/utils/debug_print.dart';

final backupServiceProvider = Provider(
  (ref) => BackupService(
    ref.watch(apiServiceProvider),
    ref.watch(appSettingsServiceProvider),
    ref.watch(albumServiceProvider),
    ref.watch(albumMediaRepositoryProvider),
    ref.watch(fileMediaRepositoryProvider),
    ref.watch(assetRepositoryProvider),
    ref.watch(assetMediaRepositoryProvider),
  ),
);

class BackupService {
  final httpClient = http.Client();
  final ApiService _apiService;
  final Logger _log = Logger("BackupService");
  final AppSettingsService _appSetting;
  final AlbumService _albumService;
  final AlbumMediaRepository _albumMediaRepository;
  final FileMediaRepository _fileMediaRepository;
  final AssetRepository _assetRepository;
  final AssetMediaRepository _assetMediaRepository;

  BackupService(
    this._apiService,
    this._appSetting,
    this._albumService,
    this._albumMediaRepository,
    this._fileMediaRepository,
    this._assetRepository,
    this._assetMediaRepository,
  );

  Future<List<String>?> getDeviceBackupAsset() async {
    final String deviceId = Store.get(StoreKey.deviceId);

    try {
      return await _apiService.assetsApi.getAllUserAssetsByDeviceId(deviceId);
    } catch (e) {
      dPrint(() => 'Error [getDeviceBackupAsset] ${e.toString()}');
      return null;
    }
  }

  Future<void> _saveDuplicatedAssetIds(List<String> deviceAssetIds) =>
      _assetRepository.transaction(() => _assetRepository.upsertDuplicatedAssets(deviceAssetIds));

  /// Get duplicated asset id from database
  Future<Set<String>> getDuplicatedAssetIds() async {
    final duplicates = await _assetRepository.getAllDuplicatedAssetIds();
    return duplicates.toSet();
  }

  /// Returns all assets newer than the last successful backup per album
  /// if `useTimeFilter` is set to true, all assets will be returned
  Future<Set<BackupCandidate>> buildUploadCandidates(
    List<BackupAlbum> selectedBackupAlbums,
    List<BackupAlbum> excludedBackupAlbums, {
    bool useTimeFilter = true,
  }) async {
    final now = DateTime.now();

    final Set<BackupCandidate> toAdd = await _fetchAssetsAndUpdateLastBackup(
      selectedBackupAlbums,
      now,
      useTimeFilter: useTimeFilter,
    );

    if (toAdd.isEmpty) return {};

    final Set<BackupCandidate> toRemove = await _fetchAssetsAndUpdateLastBackup(
      excludedBackupAlbums,
      now,
      useTimeFilter: useTimeFilter,
    );

    return toAdd.difference(toRemove);
  }

  Future<Set<BackupCandidate>> _fetchAssetsAndUpdateLastBackup(
    List<BackupAlbum> backupAlbums,
    DateTime now, {
    bool useTimeFilter = true,
  }) async {
    Set<BackupCandidate> candidates = {};

    for (final BackupAlbum backupAlbum in backupAlbums) {
      final Album localAlbum;
      try {
        localAlbum = await _albumMediaRepository.get(backupAlbum.id);
      } on StateError {
        // the album no longer exists
        continue;
      }

      if (useTimeFilter && localAlbum.modifiedAt.isBefore(backupAlbum.lastBackup)) {
        continue;
      }
      final List<Asset> assets;
      try {
        assets = await _albumMediaRepository.getAssets(
          backupAlbum.id,
          modifiedFrom: useTimeFilter
              ?
                // subtract 2 seconds to prevent missing assets due to rounding issues
                backupAlbum.lastBackup.subtract(const Duration(seconds: 2))
              : null,
          modifiedUntil: useTimeFilter ? now : null,
        );
      } on StateError {
        // either there are no assets matching the filter criteria OR the album no longer exists
        continue;
      }

      // Add album's name to the asset info
      for (final asset in assets) {
        List<String> albumNames = [localAlbum.name];

        final existingAsset = candidates.firstWhereOrNull((candidate) => candidate.asset.localId == asset.localId);

        if (existingAsset != null) {
          albumNames.addAll(existingAsset.albumNames);
          candidates.remove(existingAsset);
        }

        candidates.add(BackupCandidate(asset: asset, albumNames: albumNames));
      }

      backupAlbum.lastBackup = now;
    }

    return candidates;
  }

  /// Returns a new list of assets not yet uploaded
  Future<Set<BackupCandidate>> removeAlreadyUploadedAssets(Set<BackupCandidate> candidates) async {
    if (candidates.isEmpty) {
      return candidates;
    }

    // 1. Check strict local validation (if we already know it's duplicated in local DB)
    final Set<String> duplicatedAssetIds = await getDuplicatedAssetIds();
    candidates.removeWhere((candidate) => duplicatedAssetIds.contains(candidate.asset.localId));

    if (candidates.isEmpty) {
      return candidates;
    }

    // 2. Compute SHA1 hashes for all candidates to check for content-duplication
    final List<AssetBulkUploadCheckItem> checkItems = [];
    final Map<String, BackupCandidate> hashToCandidate = {};

    for (final candidate in candidates) {
      try {
        final File? file = await candidate.asset.local?.originFile;
        if (file != null && await file.exists()) {
          final hash = await _computeHash(file);
          if (hash != null) {
            // Update checksum in local entity if not set
            if (candidate.asset.checksum != hash) {
              candidate.asset.checksum = hash;
              // We could save this to DB here, but let's wait until we process results
              // to avoid too many writes if not needed immediately.
            }
            checkItems.add(AssetBulkUploadCheckItem(id: candidate.asset.localId!, checksum: hash));
            hashToCandidate[candidate.asset.localId!] = candidate;
          }
        }
      } catch (e) {
        _log.warning("Failed to compute hash for ${candidate.asset.localId}: $e");
      }
    }

    // 3. Check against server for existing assets by checksum
    if (checkItems.isNotEmpty) {
      try {
        final AssetBulkUploadCheckDto checkDto = AssetBulkUploadCheckDto(assets: checkItems);
        final AssetBulkUploadCheckResponseDto? response = await _apiService.assetsApi.checkBulkUpload(checkDto);

        if (response != null) {
          final List<Asset> assetsToUpdate = [];

          for (final result in response.results) {
            final String localId = result.id;
            final String? remoteId = result.assetId;
            final BackupCandidate? candidate = hashToCandidate[localId];

            if (candidate != null) {
              if (result.action == AssetBulkUploadCheckResultActionEnum.reject &&
                  result.reason == AssetBulkUploadCheckResultReasonEnum.duplicate &&
                  remoteId != null) {
                // Content duplicate found! Link local asset to existing remote asset.
                _log.info("Duplicate found: Local $localId matches Remote $remoteId");

                candidate.asset.remoteId = remoteId;
                // Mark as merged so it shows as synced
                // Note: The storage getter derives state from remoteId & localId presence

                assetsToUpdate.add(candidate.asset);

                // Remove from upload queue
                candidates.remove(candidate);
              }
            }
          }

          // Bulk update the database with new remoteIds
          if (assetsToUpdate.isNotEmpty) {
            await _assetRepository.updateAll(assetsToUpdate);
          }
        }
      } catch (e) {
        _log.severe("Error checking bulk upload duplicates: $e");
        // Fallback to old check if this fails?
        // For now, proceed to strict check or return current candidates
      }
    }

    if (candidates.isEmpty) {
      return candidates;
    }

    // 4. Fallback/Legacy Check: Check strictly by ID (for devices that restored backups but kept same IDs?? unlikely but safe)
    // Or plain check for previously uploaded IDs that might have been lost in local DB sync
    final Set<String> existing = {};
    try {
      final String deviceId = Store.get(StoreKey.deviceId);
      final CheckExistingAssetsResponseDto? duplicates = await _apiService.assetsApi.checkExistingAssets(
        CheckExistingAssetsDto(deviceAssetIds: candidates.map((c) => c.asset.localId!).toList(), deviceId: deviceId),
      );
      if (duplicates != null) {
        existing.addAll(duplicates.existingIds);
      }
    } on ApiException {
      // workaround for older server versions or when checking for too many assets at once
      final List<String>? allAssetsInDatabase = await getDeviceBackupAsset();
      if (allAssetsInDatabase != null) {
        existing.addAll(allAssetsInDatabase);
      }
    }

    if (existing.isNotEmpty) {
      candidates.removeWhere((c) => existing.contains(c.asset.localId));
    }

    return candidates;
  }

  Future<String?> _computeHash(File file) async {
    try {
      final stream = file.openRead();
      final digest = await sha1.bind(stream).first;
      return base64.encode(digest.bytes);
    } catch (e) {
      _log.warning("Could not compute hash for file ${file.path}: $e");
      return null;
    }
  }

  Future<bool> _checkPermissions() async {
    if (Platform.isAndroid && !(await pm.Permission.accessMediaLocation.status).isGranted) {
      // double check that permission is granted here, to guard against
      // uploading corrupt assets without EXIF information
      _log.warning(
        "Media location permission is not granted. "
        "Cannot access original assets for backup.",
      );

      return false;
    }

    // DON'T KNOW WHY BUT THIS HELPS BACKGROUND BACKUP TO WORK ON IOS
    if (Platform.isIOS) {
      await _fileMediaRepository.requestExtendedPermissions();
    }

    return true;
  }

  /// Upload images before video assets for background tasks
  /// these are further sorted by using their creation date
  List<BackupCandidate> _sortPhotosFirst(List<BackupCandidate> candidates) {
    return candidates.sorted((a, b) {
      final cmp = a.asset.type.index - b.asset.type.index;
      if (cmp != 0) return cmp;
      return a.asset.fileCreatedAt.compareTo(b.asset.fileCreatedAt);
    });
  }

  Future<bool> backupAsset(
    Iterable<BackupCandidate> assets,
    http.CancellationToken cancelToken, {
    bool isBackground = false,
    PMProgressHandler? pmProgressHandler,
    required void Function(SuccessUploadAsset result) onSuccess,
    required void Function(int bytes, int totalBytes) onProgress,
    required void Function(CurrentUploadAsset asset) onCurrentAsset,
    required void Function(ErrorUploadAsset error) onError,
  }) async {
    final bool isIgnoreIcloudAssets = _appSetting.getSetting(AppSettingsEnum.ignoreIcloudAssets);
    final shouldSyncAlbums = _appSetting.getSetting(AppSettingsEnum.syncAlbums);
    final String deviceId = Store.get(StoreKey.deviceId);
    final String savedEndpoint = Store.get(StoreKey.serverEndpoint);
    final List<String> duplicatedAssetIds = [];
    bool anyErrors = false;

    final hasPermission = await _checkPermissions();
    if (!hasPermission) {
      return false;
    }

    List<BackupCandidate> candidates = assets.toList();
    if (isBackground) {
      candidates = _sortPhotosFirst(candidates);
    }

    for (final candidate in candidates) {
      final Asset asset = candidate.asset;
      File? file;
      File? livePhotoFile;

      try {
        final isAvailableLocally = await asset.local!.isLocallyAvailable(isOrigin: true);

        // Handle getting files from iCloud
        if (!isAvailableLocally && Platform.isIOS) {
          // Skip iCloud assets if the user has disabled this feature
          if (isIgnoreIcloudAssets) {
            continue;
          }

          onCurrentAsset(
            CurrentUploadAsset(
              id: asset.localId!,
              fileCreatedAt: asset.fileCreatedAt.year == 1970 ? asset.fileModifiedAt : asset.fileCreatedAt,
              fileName: asset.fileName,
              fileType: _getAssetType(asset.type),
              iCloudAsset: true,
            ),
          );

          file = await asset.local!.loadFile(progressHandler: pmProgressHandler);
          if (asset.local!.isLivePhoto) {
            livePhotoFile = await asset.local!.loadFile(withSubtype: true, progressHandler: pmProgressHandler);
          }
        } else {
          file = await asset.local!.originFile.timeout(const Duration(seconds: 5));

          if (asset.local!.isLivePhoto) {
            livePhotoFile = await asset.local!.originFileWithSubtype.timeout(const Duration(seconds: 5));
          }
        }

        String? originalFileName = await _assetMediaRepository.getOriginalFilename(asset.localId!);
        originalFileName ??= asset.fileName;

        if (asset.local!.isLivePhoto) {
          if (livePhotoFile == null) {
            _log.warning("Failed to obtain motion part of the livePhoto - $originalFileName");
          }
        }

        if (file == null) {
          _log.warning("Original file not found for asset ${asset.localId}");
          continue;
        }

        final fileStream = file.openRead();
        final assetRawUploadData = http.MultipartFile(
          "assetData",
          fileStream,
          file.lengthSync(),
          filename: originalFileName,
        );

        final baseRequest = MultipartRequest(
          'POST',
          Uri.parse('$savedEndpoint/assets'),
          onProgress: ((bytes, totalBytes) => onProgress(bytes, totalBytes)),
        );

        baseRequest.headers.addAll(ApiService.getRequestHeaders());
        baseRequest.fields['deviceAssetId'] = asset.localId!;
        baseRequest.fields['deviceId'] = deviceId;
        baseRequest.fields['fileCreatedAt'] = asset.fileCreatedAt.toUtc().toIso8601String();
        baseRequest.fields['fileModifiedAt'] = asset.fileModifiedAt.toUtc().toIso8601String();
        baseRequest.fields['isFavorite'] = asset.isFavorite.toString();
        baseRequest.fields['duration'] = asset.duration.toString();
        baseRequest.files.add(assetRawUploadData);

        onCurrentAsset(
          CurrentUploadAsset(
            id: asset.localId!,
            fileCreatedAt: asset.fileCreatedAt.year == 1970 ? asset.fileModifiedAt : asset.fileCreatedAt,
            fileName: originalFileName,
            fileType: _getAssetType(asset.type),
            fileSize: file.lengthSync(),
            iCloudAsset: false,
          ),
        );

        String? livePhotoVideoId;
        if (asset.local!.isLivePhoto && livePhotoFile != null) {
          livePhotoVideoId = await uploadLivePhotoVideo(originalFileName, livePhotoFile, baseRequest, cancelToken);
        }

        if (livePhotoVideoId != null) {
          baseRequest.fields['livePhotoVideoId'] = livePhotoVideoId;
        }

        final response = await httpClient.send(baseRequest, cancellationToken: cancelToken);

        final responseBody = jsonDecode(await response.stream.bytesToString());

        if (![200, 201].contains(response.statusCode)) {
          final error = responseBody;
          final errorMessage = error['message'] ?? error['error'];

          dPrint(
            () =>
                "Error(${error['statusCode']}) uploading ${asset.localId} | $originalFileName | Created on ${asset.fileCreatedAt} | ${error['error']}",
          );

          onError(
            ErrorUploadAsset(
              asset: asset,
              id: asset.localId!,
              fileCreatedAt: asset.fileCreatedAt,
              fileName: originalFileName,
              fileType: _getAssetType(candidate.asset.type),
              errorMessage: errorMessage,
            ),
          );

          if (errorMessage == "Quota has been exceeded!") {
            anyErrors = true;
            break;
          }

          continue;
        }

        bool isDuplicate = false;
        if (response.statusCode == 200) {
          isDuplicate = true;
          duplicatedAssetIds.add(asset.localId!);
        }

        onSuccess(
          SuccessUploadAsset(
            candidate: candidate,
            remoteAssetId: responseBody['id'] as String,
            isDuplicate: isDuplicate,
          ),
        );

        if (shouldSyncAlbums) {
          await _albumService.syncUploadAlbums(candidate.albumNames, [responseBody['id'] as String]);
        }
      } on http.CancelledException {
        dPrint(() => "Backup was cancelled by the user");
        anyErrors = true;
        break;
      } catch (error, stackTrace) {
        dPrint(() => "Error backup asset: ${error.toString()}: $stackTrace");
        anyErrors = true;
        continue;
      } finally {
        if (Platform.isIOS) {
          try {
            await file?.delete();
            await livePhotoFile?.delete();
          } catch (e) {
            dPrint(() => "ERROR deleting file: ${e.toString()}");
          }
        }
      }
    }

    if (duplicatedAssetIds.isNotEmpty) {
      await _saveDuplicatedAssetIds(duplicatedAssetIds);
    }

    return !anyErrors;
  }

  Future<String?> uploadLivePhotoVideo(
    String originalFileName,
    File? livePhotoVideoFile,
    MultipartRequest baseRequest,
    http.CancellationToken cancelToken,
  ) async {
    if (livePhotoVideoFile == null) {
      return null;
    }
    final livePhotoTitle = p.setExtension(originalFileName, p.extension(livePhotoVideoFile.path));
    final fileStream = livePhotoVideoFile.openRead();
    final livePhotoRawUploadData = http.MultipartFile(
      "assetData",
      fileStream,
      livePhotoVideoFile.lengthSync(),
      filename: livePhotoTitle,
    );
    final livePhotoReq = MultipartRequest(baseRequest.method, baseRequest.url, onProgress: baseRequest.onProgress)
      ..headers.addAll(baseRequest.headers)
      ..fields.addAll(baseRequest.fields);

    livePhotoReq.files.add(livePhotoRawUploadData);

    var response = await httpClient.send(livePhotoReq, cancellationToken: cancelToken);

    var responseBody = jsonDecode(await response.stream.bytesToString());

    if (![200, 201].contains(response.statusCode)) {
      var error = responseBody;

      dPrint(
        () => "Error(${error['statusCode']}) uploading livePhoto for assetId | $livePhotoTitle | ${error['error']}",
      );
    }

    return responseBody.containsKey('id') ? responseBody['id'] : null;
  }

  String _getAssetType(AssetType assetType) => switch (assetType) {
    AssetType.audio => "AUDIO",
    AssetType.image => "IMAGE",
    AssetType.video => "VIDEO",
    AssetType.other => "OTHER",
  };
}

class MultipartRequest extends http.MultipartRequest {
  /// Creates a new [MultipartRequest].
  MultipartRequest(super.method, super.url, {required this.onProgress});

  final void Function(int bytes, int totalBytes) onProgress;

  /// Freezes all mutable fields and returns a
  /// single-subscription [http.ByteStream]
  /// that will emit the request body.
  @override
  http.ByteStream finalize() {
    final byteStream = super.finalize();

    final total = contentLength;
    var bytes = 0;

    final t = StreamTransformer.fromHandlers(
      handleData: (List<int> data, EventSink<List<int>> sink) {
        bytes += data.length;
        onProgress.call(bytes, total);
        sink.add(data);
      },
    );
    final stream = byteStream.transform(t);
    return http.ByteStream(stream);
  }
}
