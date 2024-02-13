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

  /// Performs an HTTP 'GET /search' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [bool] clip:
  ///   @deprecated
  ///
  /// * [bool] motion:
  ///
  /// * [num] page:
  ///
  /// * [String] q:
  ///
  /// * [String] query:
  ///
  /// * [bool] recent:
  ///
  /// * [num] size:
  ///
  /// * [bool] smart:
  ///
  /// * [String] type:
  ///
  /// * [bool] withArchived:
  Future<Response> searchWithHttpInfo({ bool? clip, bool? motion, num? page, String? q, String? query, bool? recent, num? size, bool? smart, String? type, bool? withArchived, }) async {
    // ignore: prefer_const_declarations
    final path = r'/search';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (clip != null) {
      queryParams.addAll(_queryParams('', 'clip', clip));
    }
    if (motion != null) {
      queryParams.addAll(_queryParams('', 'motion', motion));
    }
    if (page != null) {
      queryParams.addAll(_queryParams('', 'page', page));
    }
    if (q != null) {
      queryParams.addAll(_queryParams('', 'q', q));
    }
    if (query != null) {
      queryParams.addAll(_queryParams('', 'query', query));
    }
    if (recent != null) {
      queryParams.addAll(_queryParams('', 'recent', recent));
    }
    if (size != null) {
      queryParams.addAll(_queryParams('', 'size', size));
    }
    if (smart != null) {
      queryParams.addAll(_queryParams('', 'smart', smart));
    }
    if (type != null) {
      queryParams.addAll(_queryParams('', 'type', type));
    }
    if (withArchived != null) {
      queryParams.addAll(_queryParams('', 'withArchived', withArchived));
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
  /// * [bool] clip:
  ///   @deprecated
  ///
  /// * [bool] motion:
  ///
  /// * [num] page:
  ///
  /// * [String] q:
  ///
  /// * [String] query:
  ///
  /// * [bool] recent:
  ///
  /// * [num] size:
  ///
  /// * [bool] smart:
  ///
  /// * [String] type:
  ///
  /// * [bool] withArchived:
  Future<SearchResponseDto?> search({ bool? clip, bool? motion, num? page, String? q, String? query, bool? recent, num? size, bool? smart, String? type, bool? withArchived, }) async {
    final response = await searchWithHttpInfo( clip: clip, motion: motion, page: page, q: q, query: query, recent: recent, size: size, smart: smart, type: type, withArchived: withArchived, );
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

  /// Performs an HTTP 'GET /search/metadata' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] checksum:
  ///
  /// * [String] city:
  ///
  /// * [String] country:
  ///
  /// * [DateTime] createdAfter:
  ///
  /// * [DateTime] createdBefore:
  ///
  /// * [String] deviceAssetId:
  ///
  /// * [String] deviceId:
  ///
  /// * [String] encodedVideoPath:
  ///
  /// * [String] id:
  ///
  /// * [bool] isArchived:
  ///
  /// * [bool] isEncoded:
  ///
  /// * [bool] isExternal:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] isMotion:
  ///
  /// * [bool] isOffline:
  ///
  /// * [bool] isReadOnly:
  ///
  /// * [bool] isVisible:
  ///
  /// * [String] lensModel:
  ///
  /// * [String] libraryId:
  ///
  /// * [String] make:
  ///
  /// * [String] model:
  ///
  /// * [AssetOrder] order:
  ///
  /// * [String] originalFileName:
  ///
  /// * [String] originalPath:
  ///
  /// * [num] page:
  ///
  /// * [String] resizePath:
  ///
  /// * [num] size:
  ///
  /// * [String] state:
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
  /// * [String] webpPath:
  ///
  /// * [bool] withArchived:
  ///
  /// * [bool] withDeleted:
  ///
  /// * [bool] withExif:
  ///
  /// * [bool] withPeople:
  ///
  /// * [bool] withStacked:
  Future<Response> searchMetadataWithHttpInfo({ String? checksum, String? city, String? country, DateTime? createdAfter, DateTime? createdBefore, String? deviceAssetId, String? deviceId, String? encodedVideoPath, String? id, bool? isArchived, bool? isEncoded, bool? isExternal, bool? isFavorite, bool? isMotion, bool? isOffline, bool? isReadOnly, bool? isVisible, String? lensModel, String? libraryId, String? make, String? model, AssetOrder? order, String? originalFileName, String? originalPath, num? page, String? resizePath, num? size, String? state, DateTime? takenAfter, DateTime? takenBefore, DateTime? trashedAfter, DateTime? trashedBefore, AssetTypeEnum? type, DateTime? updatedAfter, DateTime? updatedBefore, String? webpPath, bool? withArchived, bool? withDeleted, bool? withExif, bool? withPeople, bool? withStacked, }) async {
    // ignore: prefer_const_declarations
    final path = r'/search/metadata';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (checksum != null) {
      queryParams.addAll(_queryParams('', 'checksum', checksum));
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
    if (deviceAssetId != null) {
      queryParams.addAll(_queryParams('', 'deviceAssetId', deviceAssetId));
    }
    if (deviceId != null) {
      queryParams.addAll(_queryParams('', 'deviceId', deviceId));
    }
    if (encodedVideoPath != null) {
      queryParams.addAll(_queryParams('', 'encodedVideoPath', encodedVideoPath));
    }
    if (id != null) {
      queryParams.addAll(_queryParams('', 'id', id));
    }
    if (isArchived != null) {
      queryParams.addAll(_queryParams('', 'isArchived', isArchived));
    }
    if (isEncoded != null) {
      queryParams.addAll(_queryParams('', 'isEncoded', isEncoded));
    }
    if (isExternal != null) {
      queryParams.addAll(_queryParams('', 'isExternal', isExternal));
    }
    if (isFavorite != null) {
      queryParams.addAll(_queryParams('', 'isFavorite', isFavorite));
    }
    if (isMotion != null) {
      queryParams.addAll(_queryParams('', 'isMotion', isMotion));
    }
    if (isOffline != null) {
      queryParams.addAll(_queryParams('', 'isOffline', isOffline));
    }
    if (isReadOnly != null) {
      queryParams.addAll(_queryParams('', 'isReadOnly', isReadOnly));
    }
    if (isVisible != null) {
      queryParams.addAll(_queryParams('', 'isVisible', isVisible));
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
    if (model != null) {
      queryParams.addAll(_queryParams('', 'model', model));
    }
    if (order != null) {
      queryParams.addAll(_queryParams('', 'order', order));
    }
    if (originalFileName != null) {
      queryParams.addAll(_queryParams('', 'originalFileName', originalFileName));
    }
    if (originalPath != null) {
      queryParams.addAll(_queryParams('', 'originalPath', originalPath));
    }
    if (page != null) {
      queryParams.addAll(_queryParams('', 'page', page));
    }
    if (resizePath != null) {
      queryParams.addAll(_queryParams('', 'resizePath', resizePath));
    }
    if (size != null) {
      queryParams.addAll(_queryParams('', 'size', size));
    }
    if (state != null) {
      queryParams.addAll(_queryParams('', 'state', state));
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
    if (webpPath != null) {
      queryParams.addAll(_queryParams('', 'webpPath', webpPath));
    }
    if (withArchived != null) {
      queryParams.addAll(_queryParams('', 'withArchived', withArchived));
    }
    if (withDeleted != null) {
      queryParams.addAll(_queryParams('', 'withDeleted', withDeleted));
    }
    if (withExif != null) {
      queryParams.addAll(_queryParams('', 'withExif', withExif));
    }
    if (withPeople != null) {
      queryParams.addAll(_queryParams('', 'withPeople', withPeople));
    }
    if (withStacked != null) {
      queryParams.addAll(_queryParams('', 'withStacked', withStacked));
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
  /// * [String] checksum:
  ///
  /// * [String] city:
  ///
  /// * [String] country:
  ///
  /// * [DateTime] createdAfter:
  ///
  /// * [DateTime] createdBefore:
  ///
  /// * [String] deviceAssetId:
  ///
  /// * [String] deviceId:
  ///
  /// * [String] encodedVideoPath:
  ///
  /// * [String] id:
  ///
  /// * [bool] isArchived:
  ///
  /// * [bool] isEncoded:
  ///
  /// * [bool] isExternal:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] isMotion:
  ///
  /// * [bool] isOffline:
  ///
  /// * [bool] isReadOnly:
  ///
  /// * [bool] isVisible:
  ///
  /// * [String] lensModel:
  ///
  /// * [String] libraryId:
  ///
  /// * [String] make:
  ///
  /// * [String] model:
  ///
  /// * [AssetOrder] order:
  ///
  /// * [String] originalFileName:
  ///
  /// * [String] originalPath:
  ///
  /// * [num] page:
  ///
  /// * [String] resizePath:
  ///
  /// * [num] size:
  ///
  /// * [String] state:
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
  /// * [String] webpPath:
  ///
  /// * [bool] withArchived:
  ///
  /// * [bool] withDeleted:
  ///
  /// * [bool] withExif:
  ///
  /// * [bool] withPeople:
  ///
  /// * [bool] withStacked:
  Future<SearchResponseDto?> searchMetadata({ String? checksum, String? city, String? country, DateTime? createdAfter, DateTime? createdBefore, String? deviceAssetId, String? deviceId, String? encodedVideoPath, String? id, bool? isArchived, bool? isEncoded, bool? isExternal, bool? isFavorite, bool? isMotion, bool? isOffline, bool? isReadOnly, bool? isVisible, String? lensModel, String? libraryId, String? make, String? model, AssetOrder? order, String? originalFileName, String? originalPath, num? page, String? resizePath, num? size, String? state, DateTime? takenAfter, DateTime? takenBefore, DateTime? trashedAfter, DateTime? trashedBefore, AssetTypeEnum? type, DateTime? updatedAfter, DateTime? updatedBefore, String? webpPath, bool? withArchived, bool? withDeleted, bool? withExif, bool? withPeople, bool? withStacked, }) async {
    final response = await searchMetadataWithHttpInfo( checksum: checksum, city: city, country: country, createdAfter: createdAfter, createdBefore: createdBefore, deviceAssetId: deviceAssetId, deviceId: deviceId, encodedVideoPath: encodedVideoPath, id: id, isArchived: isArchived, isEncoded: isEncoded, isExternal: isExternal, isFavorite: isFavorite, isMotion: isMotion, isOffline: isOffline, isReadOnly: isReadOnly, isVisible: isVisible, lensModel: lensModel, libraryId: libraryId, make: make, model: model, order: order, originalFileName: originalFileName, originalPath: originalPath, page: page, resizePath: resizePath, size: size, state: state, takenAfter: takenAfter, takenBefore: takenBefore, trashedAfter: trashedAfter, trashedBefore: trashedBefore, type: type, updatedAfter: updatedAfter, updatedBefore: updatedBefore, webpPath: webpPath, withArchived: withArchived, withDeleted: withDeleted, withExif: withExif, withPeople: withPeople, withStacked: withStacked, );
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
  /// * [bool] withHidden:
  Future<Response> searchPersonWithHttpInfo(String name, { bool? withHidden, }) async {
    // ignore: prefer_const_declarations
    final path = r'/search/person';

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

  /// Performs an HTTP 'GET /search/smart' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] query (required):
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
  /// * [bool] isArchived:
  ///
  /// * [bool] isEncoded:
  ///
  /// * [bool] isExternal:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] isMotion:
  ///
  /// * [bool] isOffline:
  ///
  /// * [bool] isReadOnly:
  ///
  /// * [bool] isVisible:
  ///
  /// * [String] lensModel:
  ///
  /// * [String] libraryId:
  ///
  /// * [String] make:
  ///
  /// * [String] model:
  ///
  /// * [num] page:
  ///
  /// * [num] size:
  ///
  /// * [String] state:
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
  /// * [bool] withArchived:
  ///
  /// * [bool] withDeleted:
  ///
  /// * [bool] withExif:
  Future<Response> searchSmartWithHttpInfo(String query, { String? city, String? country, DateTime? createdAfter, DateTime? createdBefore, String? deviceId, bool? isArchived, bool? isEncoded, bool? isExternal, bool? isFavorite, bool? isMotion, bool? isOffline, bool? isReadOnly, bool? isVisible, String? lensModel, String? libraryId, String? make, String? model, num? page, num? size, String? state, DateTime? takenAfter, DateTime? takenBefore, DateTime? trashedAfter, DateTime? trashedBefore, AssetTypeEnum? type, DateTime? updatedAfter, DateTime? updatedBefore, bool? withArchived, bool? withDeleted, bool? withExif, }) async {
    // ignore: prefer_const_declarations
    final path = r'/search/smart';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

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
    if (isArchived != null) {
      queryParams.addAll(_queryParams('', 'isArchived', isArchived));
    }
    if (isEncoded != null) {
      queryParams.addAll(_queryParams('', 'isEncoded', isEncoded));
    }
    if (isExternal != null) {
      queryParams.addAll(_queryParams('', 'isExternal', isExternal));
    }
    if (isFavorite != null) {
      queryParams.addAll(_queryParams('', 'isFavorite', isFavorite));
    }
    if (isMotion != null) {
      queryParams.addAll(_queryParams('', 'isMotion', isMotion));
    }
    if (isOffline != null) {
      queryParams.addAll(_queryParams('', 'isOffline', isOffline));
    }
    if (isReadOnly != null) {
      queryParams.addAll(_queryParams('', 'isReadOnly', isReadOnly));
    }
    if (isVisible != null) {
      queryParams.addAll(_queryParams('', 'isVisible', isVisible));
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
    if (model != null) {
      queryParams.addAll(_queryParams('', 'model', model));
    }
    if (page != null) {
      queryParams.addAll(_queryParams('', 'page', page));
    }
      queryParams.addAll(_queryParams('', 'query', query));
    if (size != null) {
      queryParams.addAll(_queryParams('', 'size', size));
    }
    if (state != null) {
      queryParams.addAll(_queryParams('', 'state', state));
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
    if (withArchived != null) {
      queryParams.addAll(_queryParams('', 'withArchived', withArchived));
    }
    if (withDeleted != null) {
      queryParams.addAll(_queryParams('', 'withDeleted', withDeleted));
    }
    if (withExif != null) {
      queryParams.addAll(_queryParams('', 'withExif', withExif));
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
  /// * [String] query (required):
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
  /// * [bool] isArchived:
  ///
  /// * [bool] isEncoded:
  ///
  /// * [bool] isExternal:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] isMotion:
  ///
  /// * [bool] isOffline:
  ///
  /// * [bool] isReadOnly:
  ///
  /// * [bool] isVisible:
  ///
  /// * [String] lensModel:
  ///
  /// * [String] libraryId:
  ///
  /// * [String] make:
  ///
  /// * [String] model:
  ///
  /// * [num] page:
  ///
  /// * [num] size:
  ///
  /// * [String] state:
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
  /// * [bool] withArchived:
  ///
  /// * [bool] withDeleted:
  ///
  /// * [bool] withExif:
  Future<SearchResponseDto?> searchSmart(String query, { String? city, String? country, DateTime? createdAfter, DateTime? createdBefore, String? deviceId, bool? isArchived, bool? isEncoded, bool? isExternal, bool? isFavorite, bool? isMotion, bool? isOffline, bool? isReadOnly, bool? isVisible, String? lensModel, String? libraryId, String? make, String? model, num? page, num? size, String? state, DateTime? takenAfter, DateTime? takenBefore, DateTime? trashedAfter, DateTime? trashedBefore, AssetTypeEnum? type, DateTime? updatedAfter, DateTime? updatedBefore, bool? withArchived, bool? withDeleted, bool? withExif, }) async {
    final response = await searchSmartWithHttpInfo(query,  city: city, country: country, createdAfter: createdAfter, createdBefore: createdBefore, deviceId: deviceId, isArchived: isArchived, isEncoded: isEncoded, isExternal: isExternal, isFavorite: isFavorite, isMotion: isMotion, isOffline: isOffline, isReadOnly: isReadOnly, isVisible: isVisible, lensModel: lensModel, libraryId: libraryId, make: make, model: model, page: page, size: size, state: state, takenAfter: takenAfter, takenBefore: takenBefore, trashedAfter: trashedAfter, trashedBefore: trashedBefore, type: type, updatedAfter: updatedAfter, updatedBefore: updatedBefore, withArchived: withArchived, withDeleted: withDeleted, withExif: withExif, );
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
