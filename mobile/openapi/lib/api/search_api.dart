// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class SearchApi {
  SearchApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion getAssetsByCityAddedIn = .new(1, 0, 0);

  static const ApiState getAssetsByCityState = .stable;

  static const ApiVersion getExploreDataAddedIn = .new(1, 0, 0);

  static const ApiState getExploreDataState = .stable;

  static const ApiVersion searchLargeAssetsAddedIn = .new(1, 0, 0);

  static const ApiState searchLargeAssetsState = .stable;

  static const ApiVersion searchAssetsAddedIn = .new(1, 0, 0);

  static const ApiState searchAssetsState = .stable;

  static const ApiVersion searchPersonAddedIn = .new(1, 0, 0);

  static const ApiState searchPersonState = .stable;

  static const ApiVersion searchPlacesAddedIn = .new(1, 0, 0);

  static const ApiState searchPlacesState = .stable;

  static const ApiVersion searchRandomAddedIn = .new(1, 0, 0);

  static const ApiState searchRandomState = .stable;

  static const ApiVersion searchSmartAddedIn = .new(1, 0, 0);

  static const ApiState searchSmartState = .stable;

  static const ApiVersion searchAssetStatisticsAddedIn = .new(1, 0, 0);

  static const ApiState searchAssetStatisticsState = .stable;

  static const ApiVersion getSearchSuggestionsAddedIn = .new(1, 0, 0);

  static const ApiState getSearchSuggestionsState = .stable;

  /// Retrieve assets by city
  ///
  /// Retrieve a list of assets with each asset belonging to a different city. This endpoint is used on the places pages to show a single thumbnail for each city the user has assets in.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAssetsByCityWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/search/cities';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve assets by city
  ///
  /// Retrieve a list of assets with each asset belonging to a different city. This endpoint is used on the places pages to show a single thumbnail for each city the user has assets in.
  ///
  /// Available since server v1.0.0.
  Future<List<AssetResponseDto>> getAssetsByCity({Future<void>? abortTrigger}) async {
    final response = await getAssetsByCityWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<AssetResponseDto>') as List)
          .cast<AssetResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve explore data
  ///
  /// Retrieve data for the explore section, such as popular people and places.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getExploreDataWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/search/explore';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve explore data
  ///
  /// Retrieve data for the explore section, such as popular people and places.
  ///
  /// Available since server v1.0.0.
  Future<List<SearchExploreResponseDto>> getExploreData({Future<void>? abortTrigger}) async {
    final response = await getExploreDataWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<SearchExploreResponseDto>') as List)
          .cast<SearchExploreResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Search large assets
  ///
  /// Search for assets that are considered large based on specified criteria.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> searchLargeAssetsWithHttpInfo({
    List<String>? albumIds,
    String? city,
    String? country,
    DateTime? createdAfter,
    DateTime? createdBefore,
    bool? isEncoded,
    bool? isFavorite,
    bool? isMotion,
    bool? isNotInAlbum,
    bool? isOffline,
    String? lensModel,
    String? libraryId,
    String? make,
    int? minFileSize,
    String? model,
    String? ocr,
    List<String>? personIds,
    int? rating,
    int? size,
    String? state,
    List<String>? tagIds,
    DateTime? takenAfter,
    DateTime? takenBefore,
    DateTime? trashedAfter,
    DateTime? trashedBefore,
    AssetTypeEnum? type,
    DateTime? updatedAfter,
    DateTime? updatedBefore,
    AssetVisibility? visibility,
    bool? withDeleted,
    bool? withExif,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/search/large-assets';

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
      r'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Search large assets
  ///
  /// Search for assets that are considered large based on specified criteria.
  ///
  /// Available since server v1.0.0.
  Future<List<AssetResponseDto>> searchLargeAssets({
    List<String>? albumIds,
    String? city,
    String? country,
    DateTime? createdAfter,
    DateTime? createdBefore,
    bool? isEncoded,
    bool? isFavorite,
    bool? isMotion,
    bool? isNotInAlbum,
    bool? isOffline,
    String? lensModel,
    String? libraryId,
    String? make,
    int? minFileSize,
    String? model,
    String? ocr,
    List<String>? personIds,
    int? rating,
    int? size,
    String? state,
    List<String>? tagIds,
    DateTime? takenAfter,
    DateTime? takenBefore,
    DateTime? trashedAfter,
    DateTime? trashedBefore,
    AssetTypeEnum? type,
    DateTime? updatedAfter,
    DateTime? updatedBefore,
    AssetVisibility? visibility,
    bool? withDeleted,
    bool? withExif,
    Future<void>? abortTrigger,
  }) async {
    final response = await searchLargeAssetsWithHttpInfo(
      albumIds: albumIds,
      city: city,
      country: country,
      createdAfter: createdAfter,
      createdBefore: createdBefore,
      isEncoded: isEncoded,
      isFavorite: isFavorite,
      isMotion: isMotion,
      isNotInAlbum: isNotInAlbum,
      isOffline: isOffline,
      lensModel: lensModel,
      libraryId: libraryId,
      make: make,
      minFileSize: minFileSize,
      model: model,
      ocr: ocr,
      personIds: personIds,
      rating: rating,
      size: size,
      state: state,
      tagIds: tagIds,
      takenAfter: takenAfter,
      takenBefore: takenBefore,
      trashedAfter: trashedAfter,
      trashedBefore: trashedBefore,
      type: type,
      updatedAfter: updatedAfter,
      updatedBefore: updatedBefore,
      visibility: visibility,
      withDeleted: withDeleted,
      withExif: withExif,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<AssetResponseDto>') as List)
          .cast<AssetResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Search assets by metadata
  ///
  /// Search for assets based on various metadata criteria.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> searchAssetsWithHttpInfo(MetadataSearchDto metadataSearchDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/search/metadata';

    Object? postBody = metadataSearchDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

    return apiClient.invokeAPI(
      apiPath,
      r'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Search assets by metadata
  ///
  /// Search for assets based on various metadata criteria.
  ///
  /// Available since server v1.0.0.
  Future<SearchResponseDto> searchAssets(MetadataSearchDto metadataSearchDto, {Future<void>? abortTrigger}) async {
    final response = await searchAssetsWithHttpInfo(metadataSearchDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'SearchResponseDto')
          as SearchResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Search people
  ///
  /// Search for people by name.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> searchPersonWithHttpInfo({
    required String name,
    bool? withHidden,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/search/person';

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
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Search people
  ///
  /// Search for people by name.
  ///
  /// Available since server v1.0.0.
  Future<List<PersonResponseDto>> searchPerson({
    required String name,
    bool? withHidden,
    Future<void>? abortTrigger,
  }) async {
    final response = await searchPersonWithHttpInfo(name: name, withHidden: withHidden, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<PersonResponseDto>') as List)
          .cast<PersonResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Search places
  ///
  /// Search for places by name.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> searchPlacesWithHttpInfo({required String name, Future<void>? abortTrigger}) async {
    final apiPath = r'/search/places';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    queryParams.addAll(_queryParams('', 'name', name));

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Search places
  ///
  /// Search for places by name.
  ///
  /// Available since server v1.0.0.
  Future<List<PlacesResponseDto>> searchPlaces({required String name, Future<void>? abortTrigger}) async {
    final response = await searchPlacesWithHttpInfo(name: name, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<PlacesResponseDto>') as List)
          .cast<PlacesResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Search random assets
  ///
  /// Retrieve a random selection of assets based on the provided criteria.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> searchRandomWithHttpInfo(RandomSearchDto randomSearchDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/search/random';

    Object? postBody = randomSearchDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

    return apiClient.invokeAPI(
      apiPath,
      r'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Search random assets
  ///
  /// Retrieve a random selection of assets based on the provided criteria.
  ///
  /// Available since server v1.0.0.
  Future<List<AssetResponseDto>> searchRandom(RandomSearchDto randomSearchDto, {Future<void>? abortTrigger}) async {
    final response = await searchRandomWithHttpInfo(randomSearchDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<AssetResponseDto>') as List)
          .cast<AssetResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Smart asset search
  ///
  /// Perform a smart search for assets by using machine learning vectors to determine relevance.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> searchSmartWithHttpInfo(SmartSearchDto smartSearchDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/search/smart';

    Object? postBody = smartSearchDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

    return apiClient.invokeAPI(
      apiPath,
      r'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Smart asset search
  ///
  /// Perform a smart search for assets by using machine learning vectors to determine relevance.
  ///
  /// Available since server v1.0.0.
  Future<SearchResponseDto> searchSmart(SmartSearchDto smartSearchDto, {Future<void>? abortTrigger}) async {
    final response = await searchSmartWithHttpInfo(smartSearchDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'SearchResponseDto')
          as SearchResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Search asset statistics
  ///
  /// Retrieve statistical data about assets based on search criteria, such as the total matching count.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> searchAssetStatisticsWithHttpInfo(
    StatisticsSearchDto statisticsSearchDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/search/statistics';

    Object? postBody = statisticsSearchDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

    return apiClient.invokeAPI(
      apiPath,
      r'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Search asset statistics
  ///
  /// Retrieve statistical data about assets based on search criteria, such as the total matching count.
  ///
  /// Available since server v1.0.0.
  Future<SearchStatisticsResponseDto> searchAssetStatistics(
    StatisticsSearchDto statisticsSearchDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await searchAssetStatisticsWithHttpInfo(statisticsSearchDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'SearchStatisticsResponseDto')
          as SearchStatisticsResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve search suggestions
  ///
  /// Retrieve search suggestions based on partial input. This endpoint is used for typeahead search features.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getSearchSuggestionsWithHttpInfo({
    String? country,
    bool? includeNull,
    String? lensModel,
    String? make,
    String? model,
    String? state,
    required SearchSuggestionType type,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/search/suggestions';

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
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve search suggestions
  ///
  /// Retrieve search suggestions based on partial input. This endpoint is used for typeahead search features.
  ///
  /// Available since server v1.0.0.
  Future<List<String>> getSearchSuggestions({
    String? country,
    bool? includeNull,
    String? lensModel,
    String? make,
    String? model,
    String? state,
    required SearchSuggestionType type,
    Future<void>? abortTrigger,
  }) async {
    final response = await getSearchSuggestionsWithHttpInfo(
      country: country,
      includeNull: includeNull,
      lensModel: lensModel,
      make: make,
      model: model,
      state: state,
      type: type,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<String>') as List).cast<String>().toList(
        growable: false,
      );
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
