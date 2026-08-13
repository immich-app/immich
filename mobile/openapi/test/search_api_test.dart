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


/// tests for SearchApi
void main() {
  // final instance = SearchApi();

  group('tests for SearchApi', () {
    // Retrieve assets by city
    //
    // Retrieve a list of assets with each asset belonging to a different city. This endpoint is used on the places pages to show a single thumbnail for each city the user has assets in.
    //
    //Future<List<AssetResponseDto>> getAssetsByCity() async
    test('test getAssetsByCity', () async {
      // TODO
    });

    // Retrieve explore data
    //
    // Retrieve data for the explore section, such as popular people and places.
    //
    //Future<List<SearchExploreResponseDto>> getExploreData() async
    test('test getExploreData', () async {
      // TODO
    });

    // Retrieve search suggestions
    //
    // Retrieve search suggestions based on partial input. This endpoint is used for typeahead search features.
    //
    //Future<List<String>> getSearchSuggestions(SearchSuggestionType type, { String country, bool includeNull, String lensModel, String make, String model, String state }) async
    test('test getSearchSuggestions', () async {
      // TODO
    });

    // Search asset statistics
    //
    // Retrieve statistical data about assets based on search criteria, such as the total matching count.
    //
    //Future<SearchStatisticsResponseDto> searchAssetStatistics(StatisticsSearchDto statisticsSearchDto) async
    test('test searchAssetStatistics', () async {
      // TODO
    });

    // Search assets by metadata
    //
    // Search for assets based on various metadata criteria.
    //
    //Future<SearchResponseDto> searchAssets(MetadataSearchDto metadataSearchDto, { String key, String slug }) async
    test('test searchAssets', () async {
      // TODO
    });

    // Search large assets
    //
    // Search for assets that are considered large based on specified criteria.
    //
    //Future<List<AssetResponseDto>> searchLargeAssets({ List<String> albumIds, String city, String country, DateTime createdAfter, DateTime createdBefore, bool isEncoded, bool isFavorite, bool isMotion, bool isNotInAlbum, bool isOffline, String lensModel, String libraryId, String make, int minFileSize, String model, String ocr, List<String> personIds, int rating, int size, String state, List<String> tagIds, DateTime takenAfter, DateTime takenBefore, DateTime trashedAfter, DateTime trashedBefore, AssetTypeEnum type, DateTime updatedAfter, DateTime updatedBefore, AssetVisibility visibility, bool withDeleted, bool withExif }) async
    test('test searchLargeAssets', () async {
      // TODO
    });

    // Search people
    //
    // Search for people by name.
    //
    //Future<List<PersonResponseDto>> searchPerson(String name, { bool withHidden }) async
    test('test searchPerson', () async {
      // TODO
    });

    // Search places
    //
    // Search for places by name.
    //
    //Future<List<PlacesResponseDto>> searchPlaces(String name) async
    test('test searchPlaces', () async {
      // TODO
    });

    // Search random assets
    //
    // Retrieve a random selection of assets based on the provided criteria.
    //
    //Future<List<AssetResponseDto>> searchRandom(RandomSearchDto randomSearchDto) async
    test('test searchRandom', () async {
      // TODO
    });

    // Smart asset search
    //
    // Perform a smart search for assets by using machine learning vectors to determine relevance.
    //
    //Future<SearchResponseDto> searchSmart(SmartSearchDto smartSearchDto) async
    test('test searchSmart', () async {
      // TODO
    });

  });
}
