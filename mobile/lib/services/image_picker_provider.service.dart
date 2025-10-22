import 'dart:io';

import 'package:drift/drift.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/platform/image_picker_provider_api.g.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:path_provider/path_provider.dart';

final imagePickerProviderServiceProvider = Provider(
  (ref) => ImagePickerProviderService(
    ref.watch(driftProvider),
    ref.watch(userServiceProvider),
    const StorageRepository(),
    ref.watch(apiServiceProvider),
  ),
);

/// Service that handles image picker requests from Android native code
/// When other apps (like Twitter) request an image via ACTION_GET_CONTENT,
/// this service provides the image URI
class ImagePickerProviderService implements ImagePickerProviderApi {
  final Drift _db;
  final UserService _userService;
  final StorageRepository _storageRepository;
  final ApiService _apiService;

  ImagePickerProviderService(
    Drift db,
    UserService userService,
    StorageRepository storageRepository,
    ApiService apiService,
  ) : _db = db,
      _userService = userService,
      _storageRepository = storageRepository,
      _apiService = apiService {
    // Register this service with the platform channel
    ImagePickerProviderApi.setUp(this);
    dPrint(() => "ImagePickerProviderService registered");
  }

  @override
  Future<String?> pickImageForIntent() async {
    dPrint(() => "pickImageForIntent called from native");

    try {
      String userId = _userService.getMyUser().id;

      // Get assets using Drift's mergedAssetDrift (same as timeline)
      // This returns both local and remote assets
      final assets = await _db.mergedAssetDrift
          .mergedAsset(
            userIds: [userId],
            limit: (_) => Limit(1, 0), // Just get the first asset (limit 1, offset 0)
          )
          .get();

      if (assets.isEmpty) {
        dPrint(() => "No assets found for user $userId");
        return null;
      }

      final firstAsset = assets.first;

      // Convert the merged asset result to a BaseAsset
      BaseAsset asset;
      if (firstAsset.remoteId != null && firstAsset.ownerId != null) {
        // This is a remote asset (or merged)
        asset = RemoteAsset(
          id: firstAsset.remoteId!,
          localId: firstAsset.localId,
          name: firstAsset.name,
          ownerId: firstAsset.ownerId!,
          checksum: firstAsset.checksum,
          type: firstAsset.type,
          createdAt: firstAsset.createdAt,
          updatedAt: firstAsset.updatedAt,
          thumbHash: firstAsset.thumbHash,
          width: firstAsset.width,
          height: firstAsset.height,
          isFavorite: firstAsset.isFavorite,
          durationInSeconds: firstAsset.durationInSeconds,
          livePhotoVideoId: firstAsset.livePhotoVideoId,
          stackId: firstAsset.stackId,
        );
      } else {
        // This is a local-only asset
        asset = LocalAsset(
          id: firstAsset.localId!,
          remoteId: firstAsset.remoteId,
          name: firstAsset.name,
          checksum: firstAsset.checksum,
          type: firstAsset.type,
          createdAt: firstAsset.createdAt,
          updatedAt: firstAsset.updatedAt,
          width: firstAsset.width,
          height: firstAsset.height,
          isFavorite: firstAsset.isFavorite,
          durationInSeconds: firstAsset.durationInSeconds,
          orientation: firstAsset.orientation,
        );
      }

      // Try to get the file from a local asset
      if (asset is LocalAsset) {
        final file = await _storageRepository.getFileForAsset(asset.id);
        if (file != null) {
          dPrint(() => "Returning local asset URI: file://${file.path}");
          return 'file://${file.path}';
        }
      } else if (asset is RemoteAsset) {
        final remoteAsset = asset;
        
        // Check if remote asset also exists locally
        if (remoteAsset.localId != null) {
          final file = await _storageRepository.getFileForAsset(remoteAsset.localId!);
          if (file != null) {
            dPrint(() => "Returning merged asset local URI: file://${file.path}");
            return 'file://${file.path}';
          }
        }
        
        // Remote-only asset - download it
        dPrint(() => "Downloading remote asset ${remoteAsset.id}");
        final tempDir = await getTemporaryDirectory();
        final fileName = remoteAsset.name;
        final tempFile = await File('${tempDir.path}/$fileName').create();
        
        try {
          final res = await _apiService.assetsApi.downloadAssetWithHttpInfo(remoteAsset.id);
          
          if (res.statusCode != 200) {
            dPrint(() => "Asset download failed with status ${res.statusCode}");
            throw Exception("Asset download failed with status ${res.statusCode}");
          }
          
          await tempFile.writeAsBytes(res.bodyBytes);
          dPrint(() => "Downloaded remote asset to: file://${tempFile.path}");
          return 'file://${tempFile.path}';
        } catch (e) {
          dPrint(() => "Error downloading remote asset: $e");
          // Fall through to static test image
        }
      }

      // If we couldn't get any asset file, fall back to static test image
      dPrint(() => "No file available for asset, using static test image");
      final imageUri = await _getStaticTestImageUri();
      dPrint(() => "Returning image URI: $imageUri");
      return imageUri;
    } catch (e, stackTrace) {
      dPrint(() => "Error in pickImageForIntent: $e\n$stackTrace");
      return null;
    }
  }

  /// Returns a URI to a static test image
  /// Copies the immich logo from assets to a temporary file and returns a content URI
  Future<String> _getStaticTestImageUri() async {
    // Load the asset image
    final ByteData data = await rootBundle.load('assets/immich-logo.png');
    final Uint8List bytes = data.buffer.asUint8List();

    // Get temporary directory
    final Directory tempDir = await getTemporaryDirectory();
    final File tempFile = File('${tempDir.path}/picker_test_image.png');

    // Write the image to a temporary file
    await tempFile.writeAsBytes(bytes);

    // Return the file URI (Android native will convert this to a content URI if needed)
    return 'file://${tempFile.path}';
  }
}
