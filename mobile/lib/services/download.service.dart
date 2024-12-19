import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/interfaces/download.interface.dart';
import 'package:immich_mobile/interfaces/file_media.interface.dart';
import 'package:immich_mobile/models/download/livephotos_medatada.model.dart';
import 'package:immich_mobile/repositories/download.repository.dart';
import 'package:immich_mobile/repositories/file_media.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/download.dart';
import 'package:logging/logging.dart';
import 'package:crypto/crypto.dart';
import 'dart:math' show max, min;

final downloadServiceProvider = Provider(
  (ref) => DownloadService(
    ref.watch(fileMediaRepositoryProvider),
    ref.watch(downloadRepositoryProvider),
  ),
);

class DownloadService {
  final IDownloadRepository _downloadRepository;
  final IFileMediaRepository _fileMediaRepository;
  final Logger _log = Logger("DownloadService");
  void Function(TaskStatusUpdate)? onImageDownloadStatus;
  void Function(TaskStatusUpdate)? onVideoDownloadStatus;
  void Function(TaskStatusUpdate)? onLivePhotoDownloadStatus;
  void Function(TaskProgressUpdate)? onTaskProgress;

  DownloadService(
    this._fileMediaRepository,
    this._downloadRepository,
  ) {
    _downloadRepository.onImageDownloadStatus = _onImageDownloadCallback;
    _downloadRepository.onVideoDownloadStatus = _onVideoDownloadCallback;
    _downloadRepository.onLivePhotoDownloadStatus =
        _onLivePhotoDownloadCallback;
    _downloadRepository.onTaskProgress = _onTaskProgressCallback;
  }

  void _onTaskProgressCallback(TaskProgressUpdate update) {
    onTaskProgress?.call(update);
  }

  void _onImageDownloadCallback(TaskStatusUpdate update) {
    onImageDownloadStatus?.call(update);
  }

  void _onVideoDownloadCallback(TaskStatusUpdate update) {
    onVideoDownloadStatus?.call(update);
  }

  void _onLivePhotoDownloadCallback(TaskStatusUpdate update) {
    onLivePhotoDownloadStatus?.call(update);
  }

  Future<bool> saveImageWithPath(Task task) async {
    final filePath = await task.filePath();
    final title = task.filename;
    final relativePath = Platform.isAndroid ? 'DCIM/Immich' : null;
    
    _log.info('Attempting to save image: $title');
    _log.info('Source file path: $filePath');

    try {
      
      final isDuplicate = await _isFileDuplicate(filePath, title);
      if (isDuplicate) {
        _log.info('Duplicate file detected. Skipping save: $title');
        return true; 
      }

      final sourceFile = File(filePath);
      
      
      if (!await sourceFile.exists()) {
        _log.severe('Source file does not exist: $filePath');
        return false;
      }

      
      try {
        final fileSize = await sourceFile.length();
        _log.info('Source file size: $fileSize bytes');
      } catch (e) {
        _log.severe('Cannot read source file size: $e');
      }

      final Asset? resultAsset = await _fileMediaRepository.saveImageWithFile(
        filePath,
        title: title,
        relativePath: relativePath,
      );

      if (resultAsset == null) {
        _log.severe('Failed to save image through PhotoManager');
        return false;
      }

      _log.info('Image saved successfully: $title');
      _log.info('Saved asset ID: ${resultAsset.id}');

      return true;
    } catch (error, stack) {
      _log.severe("Comprehensive error saving image", error, stack);
      return false;
    } finally {
     
      try {
        if (await File(filePath).exists()) {
          await File(filePath).delete();
          _log.info('Temporary download file deleted: $filePath');
        }
      } catch (e) {
        _log.severe('Error deleting temporary file: $e');
      }
    }
  }

  Future<bool> saveVideo(Task task) async {
    final filePath = await task.filePath();
    final title = task.filename;
    final relativePath = Platform.isAndroid ? 'DCIM/Immich' : null;
    
    _log.info('Attempting to save video: $title');
    _log.info('Source file path: $filePath');

    try {
     
      final isDuplicate = await _isFileDuplicate(filePath, title);
      if (isDuplicate) {
        _log.info('Duplicate file detected. Skipping save: $title');
        return true; 
      }

      final sourceFile = File(filePath);
      
      
      if (!await sourceFile.exists()) {
        _log.severe('Source file does not exist: $filePath');
        return false;
      }

      
      try {
        final fileSize = await sourceFile.length();
        _log.info('Source file size: $fileSize bytes');
      } catch (e) {
        _log.severe('Cannot read source file size: $e');
      }

      
      final Asset? resultAsset = await _fileMediaRepository.saveVideo(
        sourceFile,
        title: title,
        relativePath: relativePath,
      );

      if (resultAsset == null) {
        _log.severe('Failed to save video through PhotoManager');
        return false;
      }

      _log.info('Video saved successfully: $title');
      _log.info('Saved asset ID: ${resultAsset.id}');

      return true;
    } catch (error, stack) {
      _log.severe("Comprehensive error saving video", error, stack);
      return false;
    } finally {
      
      try {
        if (await File(filePath).exists()) {
          await File(filePath).delete();
          _log.info('Temporary download file deleted: $filePath');
        }
      } catch (e) {
        _log.severe('Error deleting temporary file: $e');
      }
    }
  }

  // Future<String> _getUniqueDestinationPath(String filename, String? relativePath) async {
  //   final baseDirectory = Platform.isAndroid 
  //     ? '/storage/emulated/0/DCIM/Immich' 
  //     : '${Platform.environment['HOME']}/Pictures/Immich';

   
  //   await Directory(baseDirectory).create(recursive: true);

    
  //   final filenameWithoutExtension = filename.split('.').first;
  //   final extension = filename.split('.').last;

    
  //   String destinationPath = '$baseDirectory/$filename';

    
  //   int counter = 1;
  //   while (await File(destinationPath).exists()) {
      
  //     destinationPath = '$baseDirectory/${filenameWithoutExtension} ($counter).$extension';
  //     counter++;
  //   }

  //   return destinationPath;
  // }

  Future<bool> saveLivePhotos(
    Task task,
    String livePhotosId,
  ) async {
    final records = await _downloadRepository.getLiveVideoTasks();
    if (records.length < 2) {
      return false;
    }

    final imageRecord =
        _findTaskRecord(records, livePhotosId, LivePhotosPart.image);
    final videoRecord =
        _findTaskRecord(records, livePhotosId, LivePhotosPart.video);
    final imageFilePath = await imageRecord.task.filePath();
    final videoFilePath = await videoRecord.task.filePath();

    try {
      final result = await _fileMediaRepository.saveLivePhoto(
        image: File(imageFilePath),
        video: File(videoFilePath),
        title: task.filename,
      );

      return result != null;
    } on PlatformException catch (error, stack) {
      // Handle saving MotionPhotos on iOS
      if (error.code == 'PHPhotosErrorDomain (-1)') {
        final result = await _fileMediaRepository
            .saveImageWithFile(imageFilePath, title: task.filename);
        return result != null;
      }
      _log.severe("Error saving live photo", error, stack);
      return false;
    } catch (error, stack) {
      _log.severe("Error saving live photo", error, stack);
      return false;
    } finally {
      final imageFile = File(imageFilePath);
      if (await imageFile.exists()) {
        await imageFile.delete();
      }

      final videoFile = File(videoFilePath);
      if (await videoFile.exists()) {
        await videoFile.delete();
      }

      await _downloadRepository.deleteRecordsWithIds([
        imageRecord.task.taskId,
        videoRecord.task.taskId,
      ]);
    }
  }

  Future<bool> cancelDownload(String id) async {
    return await FileDownloader().cancelTaskWithId(id);
  }

  Future<void> download(Asset asset) async {
    final assetHash = await _calculateAssetHash(asset);

    final existingLocalFile = await _findLocalFileWithHash(assetHash);
    if (existingLocalFile != null) {
      _log.info('File with hash $assetHash already exists. Skipping download.');
      return;
    }

    if (asset.isImage && asset.livePhotoVideoId != null && Platform.isIOS) {
      await _downloadRepository.download(
        _buildDownloadTask(
          asset.remoteId!,
          asset.fileName,
          group: downloadGroupLivePhoto,
          metadata: LivePhotosMetadata(
            part: LivePhotosPart.image,
            id: asset.remoteId!,
          ).toJson(),
        ),
      );

      await _downloadRepository.download(
        _buildDownloadTask(
          asset.livePhotoVideoId!,
          asset.fileName
              .toUpperCase()
              .replaceAll(RegExp(r"\.(JPG|HEIC)$"), '.MOV'),
          group: downloadGroupLivePhoto,
          metadata: LivePhotosMetadata(
            part: LivePhotosPart.video,
            id: asset.remoteId!,
          ).toJson(),
        ),
      );
    } else {
      await _downloadRepository.download(
        _buildDownloadTask(
          asset.remoteId!,
          asset.fileName,
          group: asset.isImage ? downloadGroupImage : downloadGroupVideo,
        ),
      );
    }
  }

  Future<String?> _calculateAssetHash(Asset asset) async {
    try {
      
      return asset.remoteId; 
    } catch (e) {
      _log.severe('Error calculating asset hash', e);
      return null;
    }
  }

  Future<File?> _findLocalFileWithHash(String? hash) async {
    if (hash == null) return null;

    final deviceAlbumPath = Platform.isAndroid 
      ? '/storage/emulated/0/DCIM/Immich' 
      : '${Platform.environment['HOME']}/Pictures/Immich';

    final directory = Directory(deviceAlbumPath);
    if (!await directory.exists()) return null;

    final files = await directory.list(recursive: true).toList();
    for (var fileSystemEntity in files) {
      if (fileSystemEntity is File) {
        final bytes = await fileSystemEntity.readAsBytes();
        final fileHash = sha256.convert(bytes).toString();
        if (fileHash == hash) {
          return fileSystemEntity;
        }
      }
    }
    return null;
  }

  // Future<bool> _fileExistsWithHash(String filePath, String expectedHash) async {
  //   final file = File(filePath);
  //   if (!await file.exists()) {
  //     return false;
  //   }

  //   final bytes = await file.readAsBytes();
  //   final fileHash = sha256.convert(bytes).toString();
  //   return fileHash == expectedHash;
  // }

  DownloadTask _buildDownloadTask(
    String id,
    String filename, {
    String? group,
    String? metadata,
  }) {
    final path = r'/assets/{id}/original'.replaceAll('{id}', id);
    final serverEndpoint = Store.get(StoreKey.serverEndpoint);
    final headers = ApiService.getRequestHeaders();

    return DownloadTask(
      taskId: id,
      url: serverEndpoint + path,
      headers: headers,
      filename: filename,
      updates: Updates.statusAndProgress,
      group: group ?? '',
      metaData: metadata ?? '',
    );
  }
}

Future<bool> _isFileDuplicate(String filePath, String filename) async {
  final sourceFile = File(filePath);
  
  if (!await sourceFile.exists()) {
    
    return false;
  }

  
  String? sourceHash;
  try {
    final sourceBytes = await sourceFile.readAsBytes();
    sourceHash = sha256.convert(sourceBytes).toString();
    
  } catch (e) {
    
    return false;
  }

  
  final searchDirectory = Platform.isAndroid 
    ? '/storage/emulated/0/DCIM/Immich' 
    : '${Platform.environment['HOME']}/Pictures/Immich';

  final directory = Directory(searchDirectory);
  if (!await directory.exists()) {
    
    return false;
  }

  
  final files = await directory.list(recursive: true).toList();
  
  for (var fileEntity in files) {
    if (fileEntity is File) {
      final existingFilePath = fileEntity.path;
      final existingFileName = existingFilePath.split('/').last;
      
     
      if (_areFilenamesSimilar(existingFileName, filename)) {
        
        try {
          final existingBytes = await fileEntity.readAsBytes();
          final existingHash = sha256.convert(existingBytes).toString();
          
         
          
          if (existingHash == sourceHash) {
            
            return true;
          } else {
            return false;
          }
        } catch (e) {
          
          return false;
        }
      }

      // Separate hash check
      try {
        final existingBytes = await fileEntity.readAsBytes();
        final existingHash = sha256.convert(existingBytes).toString();
        
        if (existingHash == sourceHash) {
         
          return true;
        }
      } catch (e) {
        return false;
      }
    }
  }

  
  return false;
}

bool _areFilenamesSimilar(String existingFileName, String newFileName) {
  
  final existingName = existingFileName.split('.').first.toLowerCase();
  final newName = newFileName.split('.').first.toLowerCase();
  final existingExt = existingFileName.split('.').last.toLowerCase();
  final newExt = newFileName.split('.').last.toLowerCase();

  
  final exactMatch = existingName == newName && existingExt == newExt;
  
  
  final numberedMatch = RegExp(r'^' + RegExp.escape(newName) + r'\s*\(\d+\)$').hasMatch(existingName);
  
  
  final similarityThreshold = 0.8;
  final similarityScore = _calculateStringSimilarity(existingName, newName);
  final extensionMatch = existingExt == newExt;



  return exactMatch || 
         numberedMatch || 
         (similarityScore >= similarityThreshold && extensionMatch);
}

double _calculateStringSimilarity(String s1, String s2) {
  
  if (s1 == s2) return 1.0;
  if (s1.isEmpty || s2.isEmpty) return 0.0;

  final len1 = s1.length;
  final len2 = s2.length;
  final maxLen = max(len1, len2);

  final distance = _levenshteinDistance(s1, s2);
  return 1.0 - (distance / maxLen);
}

int _levenshteinDistance(String s1, String s2) {
  final m = s1.length;
  final n = s2.length;
  final dp = List.generate(m + 1, (_) => List.filled(n + 1, 0));

  for (var i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (var j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (var i = 1; i <= m; i++) {
    for (var j = 1; j <= n; j++) {
      final cost = s1[i - 1] == s2[j - 1] ? 0 : 1;
      dp[i][j] = min(
        min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[m][n];
}

TaskRecord _findTaskRecord(
  List<TaskRecord> records,
  String livePhotosId,
  LivePhotosPart part,
) {
  return records.firstWhere((record) {
    final metadata = LivePhotosMetadata.fromJson(record.task.metaData);
    return metadata.id == livePhotosId && metadata.part == part;
  });
}
