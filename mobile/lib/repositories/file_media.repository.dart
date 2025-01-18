import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/auth.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/interfaces/file_media.interface.dart';
import 'package:immich_mobile/providers/domain/auth.provider.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:photo_manager/photo_manager.dart' hide AssetType;

final fileMediaRepositoryProvider = Provider(
  (ref) => FileMediaRepository(authService: ref.watch(authServiceProvider)),
);

class FileMediaRepository implements IFileMediaRepository {
  // TODO: Ugly, remove it while refactoring
  final AuthService _authService;

  const FileMediaRepository({required AuthService authService})
      : _authService = authService;

  @override
  Future<Asset?> saveImage(
    Uint8List data, {
    required String title,
    String? relativePath,
  }) async {
    final entity = await PhotoManager.editor.saveImage(
      data,
      filename: title,
      title: title,
      relativePath: relativePath,
    );
    return AssetMediaRepository.toAsset(entity, _authService);
  }

  @override
  Future<Asset?> saveImageWithFile(
    String filePath, {
    String? title,
    String? relativePath,
  }) async {
    final entity = await PhotoManager.editor.saveImageWithPath(
      filePath,
      title: title,
      relativePath: relativePath,
    );
    return AssetMediaRepository.toAsset(entity, _authService);
  }

  @override
  Future<Asset?> saveLivePhoto({
    required File image,
    required File video,
    required String title,
  }) async {
    final entity = await PhotoManager.editor.darwin.saveLivePhoto(
      imageFile: image,
      videoFile: video,
      title: title,
    );
    return AssetMediaRepository.toAsset(entity, _authService);
  }

  @override
  Future<Asset?> saveVideo(
    File file, {
    required String title,
    String? relativePath,
  }) async {
    final entity = await PhotoManager.editor.saveVideo(
      file,
      title: title,
      relativePath: relativePath,
    );
    return AssetMediaRepository.toAsset(entity, _authService);
  }

  @override
  Future<void> clearFileCache() => PhotoManager.clearFileCache();

  @override
  Future<void> enableBackgroundAccess() =>
      PhotoManager.setIgnorePermissionCheck(true);

  @override
  Future<void> requestExtendedPermissions() =>
      PhotoManager.requestPermissionExtend();
}
