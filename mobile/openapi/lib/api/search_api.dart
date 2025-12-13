//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SearchApi {
  SearchApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Retrieve assets by city
  ///
  /// Retrieve a list of assets with each asset belonging to a different city. This endpoint is used on the places pages to show a single thumbnail for each city the user has assets in.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAssetsByCityWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/search/cities';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Retrieve assets by city
  ///
  /// Retrieve a list of assets with each asset belonging to a different city. This endpoint is used on the places pages to show a single thumbnail for each city the user has assets in.
  Future<List<AssetResponseDto>?> getAssetsByCity() async {
    final response = await getAssetsByCityWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<AssetResponseDto>') as List)
        .cast<AssetResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Retrieve explore data
  ///
  /// Retrieve data for the explore section, such as popular people and places.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getExploreDataWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/search/explore';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Retrieve explore data
  ///
  /// Retrieve data for the explore section, such as popular people and places.
  Future<List<SearchExploreResponseDto>?> getExploreData() async {
    final response = await getExploreDataWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<SearchExploreResponseDto>') as List)
        .cast<SearchExploreResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Retrieve search suggestions
  ///
  /// Retrieve search suggestions based on partial input. This endpoint is used for typeahead search features.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [SearchSuggestionType] type (required):
  ///
  /// * [String] country:
  ///
  /// * [bool] includeNull:
  ///
  /// * [String] lensModel:
  ///
  /// * [String] make:
  ///
  /// * [String] model:
  ///
  /// * [String] state:
  Future<Response> getSearchSuggestionsWithHttpInfo(SearchSuggestionType type, { String? country, bool? includeNull, String? lensModel, String? make, String? model, String? state, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/search/suggestions';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (country != null) {
      queryParams.addAll(_queryParams('', 'country', country));
    }
    if (includeNull != null) {
      queryParams.addAll(_queryParams('', 'includeNull', includeNull));
    }
    if (lensModel != null) {
      queryParams.addAll(_queryParams('', 'lensModel', lensModel));
    }
    if (make != null) {
      queryParams.addAll(_queryParams('', 'make', make));
    }
    if (model != null) {
      queryParams.addAll(_queryParams('', 'model', model));
    }
    if (state != null) {
      queryParams.addAll(_queryParams('', 'state', state));
    }
      queryParams.addAll(_queryParams('', 'type', type));

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Retrieve search suggestions
  ///
  /// Retrieve search suggestions based on partial input. This endpoint is used for typeahead search features.
  ///
  /// Parameters:
  ///
  /// * [SearchSuggestionType] type (required):
  ///
  /// * [String] country:
  ///
  /// * [bool] includeNull:
  ///
  /// * [String] lensModel:
  ///
  /// * [String] make:
  ///
  /// * [String] model:
  ///
  /// * [String] state:
  Future<List<String>?> getSearchSuggestions(SearchSuggestionType type, { String? country, bool? includeNull, String? lensModel, String? make, String? model, String? state, }) async {
    final response = await getSearchSuggestionsWithHttpInfo(type,  country: country, includeNull: includeNull, lensModel: lensModel, make: make, model: model, state: state, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<String>') as List)
        .cast<String>()
        .toList(growable: false);

    }
    return null;
  }

  /// Search asset statistics
  ///
  /// Retrieve statistical data about assets based on search criteria, such as the total matching count.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [StatisticsSearchDto] statisticsSearchDto (required):
  Future<Response> searchAssetStatisticsWithHttpInfo(StatisticsSearchDto statisticsSearchDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/search/statistics';

    // ignore: prefer_final_locals
    Object? postBody = statisticsSearchDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      apiPath,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Search asset statistics
  ///
  /// Retrieve statistical data about assets based on search criteria, such as the total matching count.
  ///
  /// Parameters:
  ///
  /// * [StatisticsSearchDto] statisticsSearchDto (required):
  Future<SearchStatisticsResponseDto?> searchAssetStatistics(StatisticsSearchDto statisticsSearchDto,) async {
    final response = await searchAssetStatisticsWithHttpInfo(statisticsSearchDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SearchStatisticsResponseDto',) as SearchStatisticsResponseDto;
    
    }
    return null;
  }

  /// Search assets by metadata
  ///
  /// Search for assets based on various metadata criteria.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [MetadataSearchDto] metadataSearchDto (required):
  Future<Response> searchAssetsWithHttpInfo(MetadataSearchDto metadataSearchDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/search/metadata';

    // ignore: prefer_final_locals
    Object? postBody = metadataSearchDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      apiPath,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Search assets by metadata
  ///
  /// Search for assets based on various metadata criteria.
  ///
  /// Parameters:
  ///
  /// * [MetadataSearchDto] metadataSearchDto (required):
  Future<SearchResponseDto?> searchAssets(MetadataSearchDto metadataSearchDto,) async {
    final response = await searchAssetsWithHttpInfo(metadataSearchDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SearchResponseDto',) as SearchResponseDto;
    
    }
    return null;
  }

  /// Search large assets
  ///
  /// Search for assets that are considered large based on specified criteria.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [List<String>] albumIds:
  ///
  /// * [String] city:
  ///
  /// * [String] country:
  ///
  /// * [DateTime] createdAfter:
  ///
  /// * [DateTime] createdBefore:
  ///
  /// * [String] deviceId:
  ///
  /// * [bool] isEncoded:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] isMotion:
  ///
  /// * [bool] isNotInAlbum:
  ///
  /// * [bool] isOffline:
  ///
  /// * [String] lensModel:
  ///
  /// * [String] libraryId:
  ///
  /// * [String] make:
  ///
  /// * [int] minFileSize:
  ///
  /// * [String] model:
  ///
  /// * [String] ocr:
  ///
  /// * [List<String>] personIds:
  ///
  /// * [num] rating:
  ///
  /// * [num] size:
  ///
  /// * [String] state:
  ///
  /// * [List<String>] tagIds:
  ///
  /// * [DateTime] takenAfter:
  ///
  /// * [DateTime] takenBefore:
  ///
  /// * [DateTime] trashedAfter:
  ///
  /// * [DateTime] trashedBefore:
  ///
  /// * [AssetTypeEnum] type:
  ///
  /// * [DateTime] updatedAfter:
  ///
  /// * [DateTime] updatedBefore:
  ///
  /// * [AssetVisibility] visibility:
  ///
  /// * [bool] withDeleted:
  ///
  /// * [bool] withExif:
  Future<Response> searchLargeAssetsWithHttpInfo({ List<String>? albumIds, String? city, String? country, DateTime? createdAfter, DateTime? createdBefore, String? deviceId, bool? isEncoded, bool? isFavorite, bool? isMotion, bool? isNotInAlbum, bool? isOffline, String? lensModel, String? libraryId, String? make, int? minFileSize, String? model, String? ocr, List<String>? personIds, num? rating, num? size, String? state, List<String>? tagIds, DateTime? takenAfter, DateTime? takenBefore, DateTime? trashedAfter, DateTime? trashedBefore, AssetTypeEnum? type, DateTime? updatedAfter, DateTime? updatedBefore, AssetVisibility? visibility, bool? withDeleted, bool? withExif, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/search/large-assets';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (albumIds != null) {
      queryParams.addAll(_queryParams('multi', 'albumIds', albumIds));
    }
    if (city != null) {
      queryParams.addAll(_queryParams('', 'city', city));
    }
    if (country != null) {
      queryParams.addAll(_queryParams('', 'country', country));
    }
    if (createdAfter != null) {
      queryParams.addAll(_queryParams('', 'createdAfter', createdAfter));
    }
    if (createdBefore != null) {
      queryParams.addAll(_queryParams('', 'createdBefore', createdBefore));
    }
    if (deviceId != null) {
      queryParams.addAll(_queryParams('', 'deviceId', deviceId));
    }
    if (isEncoded != null) {
      queryParams.addAll(_queryParams('', 'isEncoded', isEncoded));
    }
    if (isFavorite != null) {
      queryParams.addAll(_queryParams('', 'isFavorite', isFavorite));
    }
    if (isMotion != null) {
      queryParams.addAll(_queryParams('', 'isMotion', isMotion));
    }
    if (isNotInAlbum != null) {
      queryParams.addAll(_queryParams('', 'isNotInAlbum', isNotInAlbum));
    }
    if (isOffline != null) {
      queryParams.addAll(_queryParams('', 'isOffline', isOffline));
    }
    if (lensModel != null) {
      queryParams.addAll(_queryParams('', 'lensModel', lensModel));
    }
    if (libraryId != null) {
      queryParams.addAll(_queryParams('', 'libraryId', libraryId));
    }
    if (make != null) {
      queryParams.addAll(_queryParams('', 'make', make));
    }
    if (minFileSize != null) {
      queryParams.addAll(_queryParams('', 'minFileSize', minFileSize));
    }
    if (model != null) {
      queryParams.addAll(_queryParams('', 'model', model));
    }
    if (ocr != null) {
      queryParams.addAll(_queryParams('', 'ocr', ocr));
    }
    if (personIds != null) {
      queryParams.addAll(_queryParams('multi', 'personIds', personIds));
    }
    if (rating != null) {
      queryParams.addAll(_queryParams('', 'rating', rating));
    }
    if (size != null) {
      queryParams.addAll(_queryParams('', 'size', size));
    }
    if (state != null) {
      queryParams.addAll(_queryParams('', 'state', state));
    }
    if (tagIds != null) {
      queryParams.addAll(_queryParams('multi', 'tagIds', tagIds));
    }
    if (takenAfter != null) {
      queryParams.addAll(_queryParams('', 'takenAfter', takenAfter));
    }
    if (takenBefore != null) {
      queryParams.addAll(_queryParams('', 'takenBefore', takenBefore));
    }
    if (trashedAfter != null) {
      queryParams.addAll(_queryParams('', 'trashedAfter', trashedAfter));
    }
    if (trashedBefore != null) {
      queryParams.addAll(_queryParams('', 'trashedBefore', trashedBefore));
    }
    if (type != null) {
      queryParams.addAll(_queryParams('', 'type', type));
    }
    if (updatedAfter != null) {
      queryParams.addAll(_queryParams('', 'updatedAfter', updatedAfter));
    }
    if (updatedBefore != null) {
      queryParams.addAll(_queryParams('', 'updatedBefore', updatedBefore));
    }
    if (visibility != null) {
      queryParams.addAll(_queryParams('', 'visibility', visibility));
    }
    if (withDeleted != null) {
      queryParams.addAll(_queryParams('', 'withDeleted', withDeleted));
    }
    if (withExif != null) {
      queryParams.addAll(_queryParams('', 'withExif', withExif));
    }

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Search large assets
  ///
  /// Search for assets that are considered large based on specified criteria.
  ///
  /// Parameters:
  ///
  /// * [List<String>] albumIds:
  ///
  /// * [String] city:
  ///
  /// * [String] country:
  ///
  /// * [DateTime] createdAfter:
  ///
  /// * [DateTime] createdBefore:
  ///
  /// * [String] deviceId:
  ///
  /// * [bool] isEncoded:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] isMotion:
  ///
  /// * [bool] isNotInAlbum:
  ///
  /// * [bool] isOffline:
  ///
  /// * [String] lensModel:
  ///
  /// * [String] libraryId:
  ///
  /// * [String] make:
  ///
  /// * [int] minFileSize:
  ///
  /// * [String] model:
  ///
  /// * [String] ocr:
  ///
  /// * [List<String>] personIds:
  ///
  /// * [num] rating:
  ///
  /// * [num] size:
  ///
  /// * [String] state:
  ///
  /// * [List<String>] tagIds:
  ///
  /// * [DateTime] takenAfter:
  ///
  /// * [DateTime] takenBefore:
  ///
  /// * [DateTime] trashedAfter:
  ///
  /// * [DateTime] trashedBefore:
  ///
  /// * [AssetTypeEnum] type:
  ///
  /// * [DateTime] updatedAfter:
  ///
  /// * [DateTime] updatedBefore:
  ///
  /// * [AssetVisibility] visibility:
  ///
  /// * [bool] withDeleted:
  ///
  /// * [bool] withExif:
  Future<List<AssetResponseDto>?> searchLargeAssets({ List<String>? albumIds, String? city, String? country, DateTime? createdAfter, DateTime? createdBefore, String? deviceId, bool? isEncoded, bool? isFavorite, bool? isMotion, bool? isNotInAlbum, bool? isOffline, String? lensModel, String? libraryId, String? make, int? minFileSize, String? model, String? ocr, List<String>? personIds, num? rating, num? size, String? state, List<String>? tagIds, DateTime? takenAfter, DateTime? takenBefore, DateTime? trashedAfter, DateTime? trashedBefore, AssetTypeEnum? type, DateTime? updatedAfter, DateTime? updatedBefore, AssetVisibility? visibility, bool? withDeleted, bool? withExif, }) async {
    final response = await searchLargeAssetsWithHttpInfo( albumIds: albumIds, city: city, country: country, createdAfter: createdAfter, createdBefore: createdBefore, deviceId: deviceId, isEncoded: isEncoded, isFavorite: isFavorite, isMotion: isMotion, isNotInAlbum: isNotInAlbum, isOffline: isOffline, lensModel: lensModel, libraryId: libraryId, make: make, minFileSize: minFileSize, model: model, ocr: ocr, personIds: personIds, rating: rating, size: size, state: state, tagIds: tagIds, takenAfter: takenAfter, takenBefore: takenBefore, trashedAfter: trashedAfter, trashedBefore: trashedBefore, type: type, updatedAfter: updatedAfter, updatedBefore: updatedBefore, visibility: visibility, withDeleted: withDeleted, withExif: withExif, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<AssetResponseDto>') as List)
        .cast<AssetResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Search people
  ///
  /// Search for people by name.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] name (required):
  ///
  /// * [bool] withHidden:
  Future<Response> searchPersonWithHttpInfo(String name, { bool? withHidden, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/search/person';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'name', name));
    if (withHidden != null) {
      queryParams.addAll(_queryParams('', 'withHidden', withHidden));
    }

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Search people
  ///
  /// Search for people by name.
  ///
  /// Parameters:
  ///
  /// * [String] name (required):
  ///
  /// * [bool] withHidden:
  Future<List<PersonResponseDto>?> searchPerson(String name, { bool? withHidden, }) async {
    final response = await searchPersonWithHttpInfo(name,  withHidden: withHidden, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<PersonResponseDto>') as List)
        .cast<PersonResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Search places
  ///
  /// Search for places by name.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] name (required):
  Future<Response> searchPlacesWithHttpInfo(String name,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/search/places';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'name', name));

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Search places
  ///
  /// Search for places by name.
  ///
  /// Parameters:
  ///
  /// * [String] name (required):
  Future<List<PlacesResponseDto>?> searchPlaces(String name,) async {
    final response = await searchPlacesWithHttpInfo(name,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<PlacesResponseDto>') as List)
        .cast<PlacesResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Search random assets
  ///
  /// Retrieve a random selection of assets based on the provided criteria.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [RandomSearchDto] randomSearchDto (required):
  Future<Response> searchRandomWithHttpInfo(RandomSearchDto randomSearchDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/search/random';

    // ignore: prefer_final_locals
    Object? postBody = randomSearchDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      apiPath,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Search random assets
  ///
  /// Retrieve a random selection of assets based on the provided criteria.
  ///
  /// Parameters:
  ///
  /// * [RandomSearchDto] randomSearchDto (required):
  Future<List<AssetResponseDto>?> searchRandom(RandomSearchDto randomSearchDto,) async {
    final response = await searchRandomWithHttpInfo(randomSearchDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<AssetResponseDto>') as List)
        .cast<AssetResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Smart asset search
  ///
  /// Perform a smart search for assets by using machine learning vectors to determine relevance.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [SmartSearchDto] smartSearchDto (required):
  Future<Response> searchSmartWithHttpInfo(SmartSearchDto smartSearchDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/search/smart';

    // ignore: prefer_final_locals
    Object? postBody = smartSearchDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      apiPath,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Smart asset search
  ///
  /// Perform a smart search for assets by using machine learning vectors to determine relevance.
  ///
  /// Parameters:
  ///
  /// * [SmartSearchDto] smartSearchDto (required):
  Future<SearchResponseDto?> searchSmart(SmartSearchDto smartSearchDto,) async {
    final response = await searchSmartWithHttpInfo(smartSearchDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SearchResponseDto',) as SearchResponseDto;
    
    }
    return null;
  }
}
