//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

import 'package:openapi/api.dart';
import 'package:test/test.dart';


/// tests for AssetApi
void main() {
  // final instance = AssetApi();

  group('tests for AssetApi', () {
    // Checks if assets exist by checksums
    //
    //Future<AssetBulkUploadCheckResponseDto> bulkUploadCheck(AssetBulkUploadCheckDto assetBulkUploadCheckDto) async
    test('test bulkUploadCheck', () async {
      // TODO
    });

    // Check duplicated asset before uploading - for Web upload used
    //
    //Future<CheckDuplicateAssetResponseDto> checkDuplicateAsset(CheckDuplicateAssetDto checkDuplicateAssetDto, { String key }) async
    test('test checkDuplicateAsset', () async {
      // TODO
    });

    // Checks if multiple assets exist on the server and returns all existing - used by background backup
    //
    //Future<CheckExistingAssetsResponseDto> checkExistingAssets(CheckExistingAssetsDto checkExistingAssetsDto) async
    test('test checkExistingAssets', () async {
      // TODO
    });

    //Future<List<DeleteAssetResponseDto>> deleteAsset(DeleteAssetDto deleteAssetDto) async
    test('test deleteAsset', () async {
      // TODO
    });

    //Future<MultipartFile> downloadArchive(AssetIdsDto assetIdsDto, { String key }) async
    test('test downloadArchive', () async {
      // TODO
    });

    //Future<MultipartFile> downloadFile(String id, { String key }) async
    test('test downloadFile', () async {
      // TODO
    });

    // Get all AssetEntity belong to the user
    //
    //Future<List<AssetResponseDto>> getAllAssets({ String userId, bool isFavorite, bool isArchived, bool withoutThumbs, num skip, String ifNoneMatch }) async
    test('test getAllAssets', () async {
      // TODO
    });

    // Get a single asset's information
    //
    //Future<AssetResponseDto> getAssetById(String id, { String key }) async
    test('test getAssetById', () async {
      // TODO
    });

    //Future<List<AssetResponseDto>> getAssetByTimeBucket(GetAssetByTimeBucketDto getAssetByTimeBucketDto) async
    test('test getAssetByTimeBucket', () async {
      // TODO
    });

    //Future<AssetCountByTimeBucketResponseDto> getAssetCountByTimeBucket(GetAssetCountByTimeBucketDto getAssetCountByTimeBucketDto) async
    test('test getAssetCountByTimeBucket', () async {
      // TODO
    });

    //Future<List<String>> getAssetSearchTerms() async
    test('test getAssetSearchTerms', () async {
      // TODO
    });

    //Future<AssetStatsResponseDto> getAssetStats({ bool isArchived, bool isFavorite }) async
    test('test getAssetStats', () async {
      // TODO
    });

    //Future<MultipartFile> getAssetThumbnail(String id, { ThumbnailFormat format, String key }) async
    test('test getAssetThumbnail', () async {
      // TODO
    });

    //Future<List<CuratedLocationsResponseDto>> getCuratedLocations() async
    test('test getCuratedLocations', () async {
      // TODO
    });

    //Future<List<CuratedObjectsResponseDto>> getCuratedObjects() async
    test('test getCuratedObjects', () async {
      // TODO
    });

    //Future<DownloadResponseDto> getDownloadInfo({ List<String> assetIds, String albumId, String userId, num archiveSize, String key }) async
    test('test getDownloadInfo', () async {
      // TODO
    });

    //Future<List<MapMarkerResponseDto>> getMapMarkers({ bool isFavorite, DateTime fileCreatedAfter, DateTime fileCreatedBefore }) async
    test('test getMapMarkers', () async {
      // TODO
    });

    //Future<List<MemoryLaneResponseDto>> getMemoryLane(DateTime timestamp) async
    test('test getMemoryLane', () async {
      // TODO
    });

    // Get all asset of a device that are in the database, ID only.
    //
    //Future<List<String>> getUserAssetsByDeviceId(String deviceId) async
    test('test getUserAssetsByDeviceId', () async {
      // TODO
    });

    //Future<AssetFileUploadResponseDto> importFile(ImportAssetDto importAssetDto) async
    test('test importFile', () async {
      // TODO
    });

    //Future<List<AssetResponseDto>> searchAsset(SearchAssetDto searchAssetDto) async
    test('test searchAsset', () async {
      // TODO
    });

    //Future<MultipartFile> serveFile(String id, { bool isThumb, bool isWeb, String key }) async
    test('test serveFile', () async {
      // TODO
    });

    // Update an asset
    //
    //Future<AssetResponseDto> updateAsset(String id, UpdateAssetDto updateAssetDto) async
    test('test updateAsset', () async {
      // TODO
    });

    //Future<AssetFileUploadResponseDto> uploadFile(MultipartFile assetData, String deviceAssetId, String deviceId, DateTime fileCreatedAt, DateTime fileModifiedAt, bool isFavorite, { String key, MultipartFile livePhotoData, MultipartFile sidecarData, bool isReadOnly, bool isArchived, bool isVisible, String duration }) async
    test('test uploadFile', () async {
      // TODO
    });

  });
}
