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


/// tests for AssetApi
void main() {
  // final instance = AssetApi();

  group('tests for AssetApi', () {
    // Checks if assets exist by checksums
    //
    //Future<AssetBulkUploadCheckResponseDto> checkBulkUpload(AssetBulkUploadCheckDto assetBulkUploadCheckDto) async
    test('test checkBulkUpload', () async {
      // TODO
    });

    // Checks if multiple assets exist on the server and returns all existing - used by background backup
    //
    //Future<CheckExistingAssetsResponseDto> checkExistingAssets(CheckExistingAssetsDto checkExistingAssetsDto) async
    test('test checkExistingAssets', () async {
      // TODO
    });

    //Future deleteAssets(AssetBulkDeleteDto assetBulkDeleteDto) async
    test('test deleteAssets', () async {
      // TODO
    });

    // Get all AssetEntity belong to the user
    //
    //Future<List<AssetResponseDto>> getAllAssets({ String ifNoneMatch, bool isArchived, bool isFavorite, int skip, int take, DateTime updatedAfter, DateTime updatedBefore, String userId }) async
    test('test getAllAssets', () async {
      // TODO
    });

    // Get all asset of a device that are in the database, ID only.
    //
    //Future<List<String>> getAllUserAssetsByDeviceId(String deviceId) async
    test('test getAllUserAssetsByDeviceId', () async {
      // TODO
    });

    //Future<AssetResponseDto> getAssetInfo(String id, { String key }) async
    test('test getAssetInfo', () async {
      // TODO
    });

    //Future<AssetStatsResponseDto> getAssetStatistics({ bool isArchived, bool isFavorite, bool isTrashed }) async
    test('test getAssetStatistics', () async {
      // TODO
    });

    //Future<MultipartFile> getAssetThumbnail(String id, { ThumbnailFormat format, String key }) async
    test('test getAssetThumbnail', () async {
      // TODO
    });

    //Future<List<MapMarkerResponseDto>> getMapMarkers({ DateTime fileCreatedAfter, DateTime fileCreatedBefore, bool isArchived, bool isFavorite, bool withPartners, bool withSharedAlbums }) async
    test('test getMapMarkers', () async {
      // TODO
    });

    //Future<List<MemoryLaneResponseDto>> getMemoryLane(int day, int month) async
    test('test getMemoryLane', () async {
      // TODO
    });

    //Future<List<AssetResponseDto>> getRandom({ num count }) async
    test('test getRandom', () async {
      // TODO
    });

    //Future runAssetJobs(AssetJobsDto assetJobsDto) async
    test('test runAssetJobs', () async {
      // TODO
    });

    //Future<MultipartFile> serveFile(String id, { bool isThumb, bool isWeb, String key }) async
    test('test serveFile', () async {
      // TODO
    });

    //Future<AssetResponseDto> updateAsset(String id, UpdateAssetDto updateAssetDto) async
    test('test updateAsset', () async {
      // TODO
    });

    //Future updateAssets(AssetBulkUpdateDto assetBulkUpdateDto) async
    test('test updateAssets', () async {
      // TODO
    });

    //Future updateStackParent(UpdateStackParentDto updateStackParentDto) async
    test('test updateStackParent', () async {
      // TODO
    });

    //Future<AssetFileUploadResponseDto> uploadFile(MultipartFile assetData, String deviceAssetId, String deviceId, DateTime fileCreatedAt, DateTime fileModifiedAt, { String key, String xImmichChecksum, String duration, bool isArchived, bool isFavorite, bool isOffline, bool isVisible, String libraryId, MultipartFile livePhotoData, MultipartFile sidecarData }) async
    test('test uploadFile', () async {
      // TODO
    });

  });
}
