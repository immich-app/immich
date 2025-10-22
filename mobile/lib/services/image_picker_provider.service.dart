import 'dart:io';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/platform/image_picker_provider_api.g.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:path_provider/path_provider.dart';

final imagePickerProviderServiceProvider = Provider(
  (ref) => ImagePickerProviderService(
    const StorageRepository(),
    ref.watch(apiServiceProvider),
    ref.watch(appRouterProvider),
  ),
);

/// Service that handles image picker requests from Android native code
/// When other apps (like Twitter) request an image via ACTION_GET_CONTENT,
/// this service provides the image URI
class ImagePickerProviderService implements ImagePickerProviderApi {
  final StorageRepository _storageRepository;
  final ApiService _apiService;
  final AppRouter _appRouter;

  ImagePickerProviderService(
    StorageRepository storageRepository,
    ApiService apiService,
    AppRouter appRouter,
  ) : _storageRepository = storageRepository,
      _apiService = apiService,
      _appRouter = appRouter {
    // Register this service with the platform channel
    ImagePickerProviderApi.setUp(this);
    dPrint(() => "ImagePickerProviderService registered");
  }

  @override
  Future<List<String?>?> pickImagesForIntent() async {
    dPrint(() => "pickImagesForIntent called from native");

    try {
      // Show the asset selection timeline page to let the user choose images
      final selectedAssets = await _appRouter.push<Set<BaseAsset>>(
        DriftAssetSelectionTimelineRoute(),
      );

      if (selectedAssets == null || selectedAssets.isEmpty) {
        dPrint(() => "No assets selected by user");
        return null;
      }

      dPrint(() => "User selected ${selectedAssets.length} asset(s)");
      
      // Process all selected assets
      final List<String> imageUris = [];
      
      for (final asset in selectedAssets) {
        dPrint(() => "Processing asset: ${asset.runtimeType}");
        
        String? uri = await _getAssetUri(asset);
        if (uri != null) {
          imageUris.add(uri);
        }
      }
      
      if (imageUris.isEmpty) {
        dPrint(() => "No valid URIs obtained, returning null");
        return null;
      }
      
      dPrint(() => "Returning ${imageUris.length} image URI(s)");
      return imageUris;
    } catch (e, stackTrace) {
      dPrint(() => "Error in pickImagesForIntent: $e\n$stackTrace");
      return null;
    }
  }

  /// Gets the URI for a single asset (local, merged, or remote)
  Future<String?> _getAssetUri(BaseAsset asset) async {
    try {
      // Try to get the file from a local asset
      if (asset is LocalAsset) {
        final file = await _storageRepository.getFileForAsset(asset.id);
        if (file != null) {
          dPrint(() => "Got local asset URI: file://${file.path}");
          return 'file://${file.path}';
        }
      } else if (asset is RemoteAsset) {
        final remoteAsset = asset;
        
        // Check if remote asset also exists locally
        if (remoteAsset.localId != null) {
          final file = await _storageRepository.getFileForAsset(remoteAsset.localId!);
          if (file != null) {
            dPrint(() => "Got merged asset local URI: file://${file.path}");
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
            return null;
          }
          
          await tempFile.writeAsBytes(res.bodyBytes);
          dPrint(() => "Downloaded remote asset to: file://${tempFile.path}");
          return 'file://${tempFile.path}';
        } catch (e) {
          dPrint(() => "Error downloading remote asset: $e");
          return null;
        }
      }
      
      dPrint(() => "No file available for asset");
      return null;
    } catch (e) {
      dPrint(() => "Error getting asset URI: $e");
      return null;
    }
  }
}
