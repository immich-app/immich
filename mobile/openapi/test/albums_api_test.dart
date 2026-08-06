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


/// tests for AlbumsApi
void main() {
  // final instance = AlbumsApi();

  group('tests for AlbumsApi', () {
    // Add assets to an album
    //
    // Add multiple assets to a specific album by its ID.
    //
    //Future<List<BulkIdResponseDto>> addAssetsToAlbum(String id, BulkIdsDto bulkIdsDto) async
    test('test addAssetsToAlbum', () async {
      // TODO
    });

    // Add assets to albums
    //
    // Send a list of asset IDs and album IDs to add each asset to each album.
    //
    //Future<AlbumsAddAssetsResponseDto> addAssetsToAlbums(AlbumsAddAssetsDto albumsAddAssetsDto) async
    test('test addAssetsToAlbums', () async {
      // TODO
    });

    // Share album with users
    //
    // Share an album with multiple users. Each user can be given a specific role in the album.
    //
    //Future<AlbumResponseDto> addUsersToAlbum(String id, AddUsersDto addUsersDto) async
    test('test addUsersToAlbum', () async {
      // TODO
    });

    // Create an album
    //
    // Create a new album. The album can also be created with initial users and assets.
    //
    //Future<AlbumResponseDto> createAlbum(CreateAlbumDto createAlbumDto) async
    test('test createAlbum', () async {
      // TODO
    });

    // Delete an album
    //
    // Delete a specific album by its ID. Note the album is initially trashed and then immediately scheduled for deletion, but relies on a background job to complete the process.
    //
    //Future deleteAlbum(String id) async
    test('test deleteAlbum', () async {
      // TODO
    });

    // Retrieve an album
    //
    // Retrieve information about a specific album by its ID.
    //
    //Future<AlbumResponseDto> getAlbumInfo(String id, { String key, String slug }) async
    test('test getAlbumInfo', () async {
      // TODO
    });

    // Retrieve album map markers
    //
    // Retrieve map marker information for a specific album by its ID.
    //
    //Future<List<MapMarkerResponseDto>> getAlbumMapMarkers(String id, { String key, String slug }) async
    test('test getAlbumMapMarkers', () async {
      // TODO
    });

    // Retrieve album statistics
    //
    // Returns statistics about the albums available to the authenticated user.
    //
    //Future<AlbumStatisticsResponseDto> getAlbumStatistics() async
    test('test getAlbumStatistics', () async {
      // TODO
    });

    // List all albums
    //
    // Retrieve a list of albums available to the authenticated user.
    //
    //Future<List<AlbumResponseDto>> getAllAlbums({ String assetId, String id, bool isOwned, bool isShared, String name }) async
    test('test getAllAlbums', () async {
      // TODO
    });

    // Remove assets from an album
    //
    // Remove multiple assets from a specific album by its ID.
    //
    //Future<List<BulkIdResponseDto>> removeAssetFromAlbum(String id, BulkIdsDto bulkIdsDto) async
    test('test removeAssetFromAlbum', () async {
      // TODO
    });

    // Remove user from album
    //
    // Remove a user from an album. Use an ID of \"me\" to leave a shared album.
    //
    //Future removeUserFromAlbum(String id, String userId) async
    test('test removeUserFromAlbum', () async {
      // TODO
    });

    // Update an album
    //
    // Update the information of a specific album by its ID. This endpoint can be used to update the album name, description, sort order, etc. However, it is not used to add or remove assets or users from the album.
    //
    //Future<AlbumResponseDto> updateAlbumInfo(String id, UpdateAlbumDto updateAlbumDto) async
    test('test updateAlbumInfo', () async {
      // TODO
    });

    // Update user role
    //
    // Change the role for a specific user in a specific album.
    //
    //Future updateAlbumUser(String id, String userId, UpdateAlbumUserDto updateAlbumUserDto) async
    test('test updateAlbumUser', () async {
      // TODO
    });

  });
}
