//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SearchApi {
  SearchApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// 
  ///
  /// Note: This method returns the HTTP [Response].
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

  /// 
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
        .toList();

    }
    return null;
  }

  /// 
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getSearchConfigWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/search/config';

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

  /// 
  Future<SearchConfigResponseDto?> getSearchConfig() async {
    final response = await getSearchConfigWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SearchConfigResponseDto',) as SearchConfigResponseDto;
    
    }
    return null;
  }

  /// 
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] q:
  ///
  /// * [String] query:
  ///
  /// * [bool] clip:
  ///
  /// * [String] type:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] isArchived:
  ///
  /// * [String] exifInfoPeriodCity:
  ///
  /// * [String] exifInfoPeriodState:
  ///
  /// * [String] exifInfoPeriodCountry:
  ///
  /// * [String] exifInfoPeriodMake:
  ///
  /// * [String] exifInfoPeriodModel:
  ///
  /// * [List<String>] smartInfoPeriodObjects:
  ///
  /// * [List<String>] smartInfoPeriodTags:
  ///
  /// * [bool] recent:
  ///
  /// * [bool] motion:
  Future<Response> searchWithHttpInfo({ String? q, String? query, bool? clip, String? type, bool? isFavorite, bool? isArchived, String? exifInfoPeriodCity, String? exifInfoPeriodState, String? exifInfoPeriodCountry, String? exifInfoPeriodMake, String? exifInfoPeriodModel, List<String>? smartInfoPeriodObjects, List<String>? smartInfoPeriodTags, bool? recent, bool? motion, }) async {
    // ignore: prefer_const_declarations
    final path = r'/search';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (q != null) {
      queryParams.addAll(_queryParams('', 'q', q));
    }
    if (query != null) {
      queryParams.addAll(_queryParams('', 'query', query));
    }
    if (clip != null) {
      queryParams.addAll(_queryParams('', 'clip', clip));
    }
    if (type != null) {
      queryParams.addAll(_queryParams('', 'type', type));
    }
    if (isFavorite != null) {
      queryParams.addAll(_queryParams('', 'isFavorite', isFavorite));
    }
    if (isArchived != null) {
      queryParams.addAll(_queryParams('', 'isArchived', isArchived));
    }
    if (exifInfoPeriodCity != null) {
      queryParams.addAll(_queryParams('', 'exifInfo.city', exifInfoPeriodCity));
    }
    if (exifInfoPeriodState != null) {
      queryParams.addAll(_queryParams('', 'exifInfo.state', exifInfoPeriodState));
    }
    if (exifInfoPeriodCountry != null) {
      queryParams.addAll(_queryParams('', 'exifInfo.country', exifInfoPeriodCountry));
    }
    if (exifInfoPeriodMake != null) {
      queryParams.addAll(_queryParams('', 'exifInfo.make', exifInfoPeriodMake));
    }
    if (exifInfoPeriodModel != null) {
      queryParams.addAll(_queryParams('', 'exifInfo.model', exifInfoPeriodModel));
    }
    if (smartInfoPeriodObjects != null) {
      queryParams.addAll(_queryParams('multi', 'smartInfo.objects', smartInfoPeriodObjects));
    }
    if (smartInfoPeriodTags != null) {
      queryParams.addAll(_queryParams('multi', 'smartInfo.tags', smartInfoPeriodTags));
    }
    if (recent != null) {
      queryParams.addAll(_queryParams('', 'recent', recent));
    }
    if (motion != null) {
      queryParams.addAll(_queryParams('', 'motion', motion));
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

  /// 
  ///
  /// Parameters:
  ///
  /// * [String] q:
  ///
  /// * [String] query:
  ///
  /// * [bool] clip:
  ///
  /// * [String] type:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] isArchived:
  ///
  /// * [String] exifInfoPeriodCity:
  ///
  /// * [String] exifInfoPeriodState:
  ///
  /// * [String] exifInfoPeriodCountry:
  ///
  /// * [String] exifInfoPeriodMake:
  ///
  /// * [String] exifInfoPeriodModel:
  ///
  /// * [List<String>] smartInfoPeriodObjects:
  ///
  /// * [List<String>] smartInfoPeriodTags:
  ///
  /// * [bool] recent:
  ///
  /// * [bool] motion:
  Future<SearchResponseDto?> search({ String? q, String? query, bool? clip, String? type, bool? isFavorite, bool? isArchived, String? exifInfoPeriodCity, String? exifInfoPeriodState, String? exifInfoPeriodCountry, String? exifInfoPeriodMake, String? exifInfoPeriodModel, List<String>? smartInfoPeriodObjects, List<String>? smartInfoPeriodTags, bool? recent, bool? motion, }) async {
    final response = await searchWithHttpInfo( q: q, query: query, clip: clip, type: type, isFavorite: isFavorite, isArchived: isArchived, exifInfoPeriodCity: exifInfoPeriodCity, exifInfoPeriodState: exifInfoPeriodState, exifInfoPeriodCountry: exifInfoPeriodCountry, exifInfoPeriodMake: exifInfoPeriodMake, exifInfoPeriodModel: exifInfoPeriodModel, smartInfoPeriodObjects: smartInfoPeriodObjects, smartInfoPeriodTags: smartInfoPeriodTags, recent: recent, motion: motion, );
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
