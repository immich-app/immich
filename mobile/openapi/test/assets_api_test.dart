//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

import 'package:openapi/api.dart';
import 'package:test/test.dart';


/// tests for AssetsApi
void main() {
  // final instance = AssetsApi();

  group('tests for AssetsApi', () {
    // Check bulk upload
    //
    // Determine which assets have already been uploaded to the server based on their SHA1 checksums.
    //
    //Future<AssetBulkUploadCheckResponseDto> checkBulkUpload(AssetBulkUploadCheckDto assetBulkUploadCheckDto) async
    test('test checkBulkUpload', () async {
      // TODO
    });

    // Copy asset
    //
    // Copy asset information like albums, tags, etc. from one asset to another.
    //
    //Future copyAsset(AssetCopyDto assetCopyDto) async
    test('test copyAsset', () async {
      // TODO
    });

    // Delete asset metadata by key
    //
    // Delete a specific metadata key-value pair associated with the specified asset.
    //
    //Future deleteAssetMetadata(String id, String key) async
    test('test deleteAssetMetadata', () async {
      // TODO
    });

    // Delete assets
    //
    // Deletes multiple assets at the same time.
    //
    //Future deleteAssets(AssetBulkDeleteDto assetBulkDeleteDto) async
    test('test deleteAssets', () async {
      // TODO
    });

    // Delete asset metadata
    //
    // Delete metadata key-value pairs for multiple assets.
    //
    //Future deleteBulkAssetMetadata(AssetMetadataBulkDeleteDto assetMetadataBulkDeleteDto) async
    test('test deleteBulkAssetMetadata', () async {
      // TODO
    });

    // Download original asset
    //
    // Downloads the original file of the specified asset.
    //
    //Future<MultipartFile> downloadAsset(String id, { bool edited, String key, String slug }) async
    test('test downloadAsset', () async {
      // TODO
    });

    // Apply edits to an existing asset
    //
    // Apply a series of edit actions (crop, rotate, mirror) to the specified asset.
    //
    //Future<AssetEditsResponseDto> editAsset(String id, AssetEditsCreateDto assetEditsCreateDto) async
    test('test editAsset', () async {
      // TODO
    });

    // End HLS streaming session
    //
    // Releases server resources for the streaming session.
    //
    //Future endSession(String id, String sessionId, { String key, String slug }) async
    test('test endSession', () async {
      // TODO
    });

    // Retrieve edits for an existing asset
    //
    // Retrieve a series of edit actions (crop, rotate, mirror) associated with the specified asset.
    //
    //Future<AssetEditsResponseDto> getAssetEdits(String id) async
    test('test getAssetEdits', () async {
      // TODO
    });

    // Retrieve an asset
    //
    // Retrieve detailed information about a specific asset.
    //
    //Future<AssetResponseDto> getAssetInfo(String id, { String key, String slug }) async
    test('test getAssetInfo', () async {
      // TODO
    });

    // Get asset metadata
    //
    // Retrieve all metadata key-value pairs associated with the specified asset.
    //
    //Future<List<AssetMetadataResponseDto>> getAssetMetadata(String id) async
    test('test getAssetMetadata', () async {
      // TODO
    });

    // Retrieve asset metadata by key
    //
    // Retrieve the value of a specific metadata key associated with the specified asset.
    //
    //Future<AssetMetadataResponseDto> getAssetMetadataByKey(String id, String key) async
    test('test getAssetMetadataByKey', () async {
      // TODO
    });

    // Retrieve asset OCR data
    //
    // Retrieve all OCR (Optical Character Recognition) data associated with the specified asset.
    //
    //Future<List<AssetOcrResponseDto>> getAssetOcr(String id) async
    test('test getAssetOcr', () async {
      // TODO
    });

    // Get asset statistics
    //
    // Retrieve various statistics about the assets owned by the authenticated user.
    //
    //Future<AssetStatsResponseDto> getAssetStatistics({ bool isFavorite, bool isTrashed, AssetVisibility visibility }) async
    test('test getAssetStatistics', () async {
      // TODO
    });

    // Get HLS main playlist
    //
    // Returns an HLS main playlist with all available variants for the asset.
    //
    //Future<String> getMainPlaylist(String id, { String key, String slug }) async
    test('test getMainPlaylist', () async {
      // TODO
    });

    // Get HLS media playlist
    //
    // Returns an HLS media playlist for one variant of the streaming session.
    //
    //Future<String> getMediaPlaylist(String id, String sessionId, int variantIndex, { String key, String slug, num xImmichHlsPos }) async
    test('test getMediaPlaylist', () async {
      // TODO
    });

    // Get HLS segment or init file
    //
    // Streams an HLS init segment (init.mp4) or media segment (seg_N.m4s).
    //
    //Future<MultipartFile> getSegment(String filename, String id, String sessionId, int variantIndex, { String key, String slug, int xImmichHlsMsn }) async
    test('test getSegment', () async {
      // TODO
    });

    // Play asset video
    //
    // Streams the video file for the specified asset. This endpoint also supports byte range requests.
    //
    //Future<MultipartFile> playAssetVideo(String id, { String key, String slug }) async
    test('test playAssetVideo', () async {
      // TODO
    });

    // Remove edits from an existing asset
    //
    // Removes all edit actions (crop, rotate, mirror) associated with the specified asset.
    //
    //Future removeAssetEdits(String id) async
    test('test removeAssetEdits', () async {
      // TODO
    });

    // Run an asset job
    //
    // Run a specific job on a set of assets.
    //
    //Future runAssetJobs(AssetJobsDto assetJobsDto) async
    test('test runAssetJobs', () async {
      // TODO
    });

    // Update an asset
    //
    // Update information of a specific asset.
    //
    //Future<AssetResponseDto> updateAsset(String id, UpdateAssetDto updateAssetDto) async
    test('test updateAsset', () async {
      // TODO
    });

    // Update asset metadata
    //
    // Update or add metadata key-value pairs for the specified asset.
    //
    //Future<List<AssetMetadataResponseDto>> updateAssetMetadata(String id, AssetMetadataUpsertDto assetMetadataUpsertDto) async
    test('test updateAssetMetadata', () async {
      // TODO
    });

    // Update assets
    //
    // Updates multiple assets at the same time.
    //
    //Future updateAssets(AssetBulkUpdateDto assetBulkUpdateDto) async
    test('test updateAssets', () async {
      // TODO
    });

    // Upsert asset metadata
    //
    // Upsert metadata key-value pairs for multiple assets.
    //
    //Future<List<AssetMetadataBulkResponseDto>> updateBulkAssetMetadata(AssetMetadataBulkUpsertDto assetMetadataBulkUpsertDto) async
    test('test updateBulkAssetMetadata', () async {
      // TODO
    });

    // Upload asset
    //
    // Uploads a new asset to the server.
    //
    //Future<AssetMediaResponseDto> uploadAsset(MultipartFile assetData, DateTime fileCreatedAt, DateTime fileModifiedAt, { String key, String slug, String xImmichChecksum, int duration, String filename, bool isFavorite, String livePhotoVideoId, List<AssetMetadataUpsertItemDto> metadata, MultipartFile sidecarData, AssetVisibility visibility }) async
    test('test uploadAsset', () async {
      // TODO
    });

    // View asset thumbnail
    //
    // Retrieve the thumbnail image for the specified asset. Viewing the fullsize thumbnail might redirect to downloadAsset, which requires a different permission.
    //
    //Future<MultipartFile> viewAsset(String id, { bool edited, String key, AssetMediaSize size, String slug }) async
    test('test viewAsset', () async {
      // TODO
    });

  });
}
