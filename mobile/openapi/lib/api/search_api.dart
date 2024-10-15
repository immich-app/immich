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

  /// Performs an HTTP 'GET /search/cities' operation and returns the [Response].
  Future<Response> getAssetsByCityWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/search/cities';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

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

  /// Performs an HTTP 'GET /search/explore' operation and returns the [Response].
  Future<Response> getExploreDataWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/search/explore';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

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

  /// Performs an HTTP 'GET /search/suggestions' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [SearchSuggestionType] type (required):
  ///
  /// * [String] country:
  ///
  /// * [bool] includeNull:
  ///   This property was added in v111.0.0
  ///
  /// * [String] make:
  ///
  /// * [String] model:
  ///
  /// * [String] state:
  Future<Response> getSearchSuggestionsWithHttpInfo(SearchSuggestionType type, { String? country, bool? includeNull, String? make, String? model, String? state, }) async {
    // ignore: prefer_const_declarations
    final path = r'/search/suggestions';

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
      path,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [SearchSuggestionType] type (required):
  ///
  /// * [String] country:
  ///
  /// * [bool] includeNull:
  ///   This property was added in v111.0.0
  ///
  /// * [String] make:
  ///
  /// * [String] model:
  ///
  /// * [String] state:
  Future<List<String>?> getSearchSuggestions(SearchSuggestionType type, { String? country, bool? includeNull, String? make, String? model, String? state, }) async {
    final response = await getSearchSuggestionsWithHttpInfo(type,  country: country, includeNull: includeNull, make: make, model: model, state: state, );
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

  /// Performs an HTTP 'GET /search/album' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] name (required):
  ///
  /// * [num] page:
  ///   Page number for pagination
  ///
  /// * [bool] shared:
  ///   true: only shared albums false: only non-shared own albums undefined: shared and owned albums
  ///
  /// * [num] size:
  ///   Number of items per page
  Future<Response> searchAlbumWithHttpInfo(String name, { num? page, bool? shared, num? size, }) async {
    // ignore: prefer_const_declarations
    final path = r'/search/album';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'name', name));
    if (page != null) {
      queryParams.addAll(_queryParams('', 'page', page));
    }
    if (shared != null) {
      queryParams.addAll(_queryParams('', 'shared', shared));
    }
    if (size != null) {
      queryParams.addAll(_queryParams('', 'size', size));
    }

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [String] name (required):
  ///
  /// * [num] page:
  ///   Page number for pagination
  ///
  /// * [bool] shared:
  ///   true: only shared albums false: only non-shared own albums undefined: shared and owned albums
  ///
  /// * [num] size:
  ///   Number of items per page
  Future<SearchAlbumNameResponseDto?> searchAlbum(String name, { num? page, bool? shared, num? size, }) async {
    final response = await searchAlbumWithHttpInfo(name,  page: page, shared: shared, size: size, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SearchAlbumNameResponseDto',) as SearchAlbumNameResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /search/metadata' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [MetadataSearchDto] metadataSearchDto (required):
  Future<Response> searchMetadataWithHttpInfo(MetadataSearchDto metadataSearchDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/search/metadata';

    // ignore: prefer_final_locals
    Object? postBody = metadataSearchDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [MetadataSearchDto] metadataSearchDto (required):
  Future<SearchResponseDto?> searchMetadata(MetadataSearchDto metadataSearchDto,) async {
    final response = await searchMetadataWithHttpInfo(metadataSearchDto,);
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

  /// Performs an HTTP 'GET /search/person' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] name (required):
  ///
  /// * [num] page:
  ///   This property was added in v119.0.0
  ///
  /// * [num] size:
  ///   This property was added in v119.0.0
  ///
  /// * [bool] withHidden:
  Future<Response> searchPersonWithHttpInfo(String name, { num? page, num? size, bool? withHidden, }) async {
    // ignore: prefer_const_declarations
    final path = r'/search/person';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'name', name));
    if (page != null) {
      queryParams.addAll(_queryParams('', 'page', page));
    }
    if (size != null) {
      queryParams.addAll(_queryParams('', 'size', size));
    }
    if (withHidden != null) {
      queryParams.addAll(_queryParams('', 'withHidden', withHidden));
    }

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [String] name (required):
  ///
  /// * [num] page:
  ///   This property was added in v119.0.0
  ///
  /// * [num] size:
  ///   This property was added in v119.0.0
  ///
  /// * [bool] withHidden:
  Future<SearchPersonNameResponseDto?> searchPerson(String name, { num? page, num? size, bool? withHidden, }) async {
    final response = await searchPersonWithHttpInfo(name,  page: page, size: size, withHidden: withHidden, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SearchPersonNameResponseDto',) as SearchPersonNameResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /search/places' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] name (required):
  Future<Response> searchPlacesWithHttpInfo(String name,) async {
    // ignore: prefer_const_declarations
    final path = r'/search/places';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'name', name));

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

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

  /// Performs an HTTP 'POST /search/random' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [RandomSearchDto] randomSearchDto (required):
  Future<Response> searchRandomWithHttpInfo(RandomSearchDto randomSearchDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/search/random';

    // ignore: prefer_final_locals
    Object? postBody = randomSearchDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

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

  /// Performs an HTTP 'POST /search/smart' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [SmartSearchDto] smartSearchDto (required):
  Future<Response> searchSmartWithHttpInfo(SmartSearchDto smartSearchDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/search/smart';

    // ignore: prefer_final_locals
    Object? postBody = smartSearchDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

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
