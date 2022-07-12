//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AssetApi {
  AssetApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// 
  ///
  /// Check duplicated asset before uploading - for Web upload used
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [CheckDuplicateAssetDto] checkDuplicateAssetDto (required):
  Future<Response> checkDuplicateAssetWithHttpInfo(CheckDuplicateAssetDto checkDuplicateAssetDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/check';

    // ignore: prefer_final_locals
    Object? postBody = checkDuplicateAssetDto;

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

  /// 
  ///
  /// Check duplicated asset before uploading - for Web upload used
  ///
  /// Parameters:
  ///
  /// * [CheckDuplicateAssetDto] checkDuplicateAssetDto (required):
  Future<CheckDuplicateAssetResponseDto?> checkDuplicateAsset(CheckDuplicateAssetDto checkDuplicateAssetDto,) async {
    final response = await checkDuplicateAssetWithHttpInfo(checkDuplicateAssetDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'CheckDuplicateAssetResponseDto',) as CheckDuplicateAssetResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'DELETE /asset' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [DeleteAssetDto] deleteAssetDto (required):
  Future<Response> deleteAssetWithHttpInfo(DeleteAssetDto deleteAssetDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/asset';

    // ignore: prefer_final_locals
    Object? postBody = deleteAssetDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [DeleteAssetDto] deleteAssetDto (required):
  Future<List<DeleteAssetResponseDto>?> deleteAsset(DeleteAssetDto deleteAssetDto,) async {
    final response = await deleteAssetWithHttpInfo(deleteAssetDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<DeleteAssetResponseDto>') as List)
        .cast<DeleteAssetResponseDto>()
        .toList();

    }
    return null;
  }

  /// Performs an HTTP 'GET /asset/download' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] aid (required):
  ///
  /// * [String] did (required):
  ///
  /// * [bool] isThumb:
  ///
  /// * [bool] isWeb:
  Future<Response> downloadFileWithHttpInfo(String aid, String did, { bool? isThumb, bool? isWeb, }) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/download';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'aid', aid));
      queryParams.addAll(_queryParams('', 'did', did));
    if (isThumb != null) {
      queryParams.addAll(_queryParams('', 'isThumb', isThumb));
    }
    if (isWeb != null) {
      queryParams.addAll(_queryParams('', 'isWeb', isWeb));
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
  /// * [String] aid (required):
  ///
  /// * [String] did (required):
  ///
  /// * [bool] isThumb:
  ///
  /// * [bool] isWeb:
  Future<Object?> downloadFile(String aid, String did, { bool? isThumb, bool? isWeb, }) async {
    final response = await downloadFileWithHttpInfo(aid, did,  isThumb: isThumb, isWeb: isWeb, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'Object',) as Object;
    
    }
    return null;
  }

  /// 
  ///
  /// Get all AssetEntity belong to the user
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAllAssetsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/asset';

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
  ///
  /// Get all AssetEntity belong to the user
  Future<List<AssetResponseDto>?> getAllAssets() async {
    final response = await getAllAssetsWithHttpInfo();
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
        .toList();

    }
    return null;
  }

  /// 
  ///
  /// Get a single asset's information
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] assetId (required):
  Future<Response> getAssetByIdWithHttpInfo(String assetId,) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/assetById/{assetId}'
      .replaceAll('{assetId}', assetId);

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
  ///
  /// Get a single asset's information
  ///
  /// Parameters:
  ///
  /// * [String] assetId (required):
  Future<AssetResponseDto?> getAssetById(String assetId,) async {
    final response = await getAssetByIdWithHttpInfo(assetId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetResponseDto',) as AssetResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /asset/searchTerm' operation and returns the [Response].
  Future<Response> getAssetSearchTermsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/asset/searchTerm';

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

  Future<List<String>?> getAssetSearchTerms() async {
    final response = await getAssetSearchTermsWithHttpInfo();
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
        .toList();

    }
    return null;
  }

  /// Performs an HTTP 'GET /asset/thumbnail/{assetId}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] assetId (required):
  Future<Response> getAssetThumbnailWithHttpInfo(String assetId,) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/thumbnail/{assetId}'
      .replaceAll('{assetId}', assetId);

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

  /// Parameters:
  ///
  /// * [String] assetId (required):
  Future<Object?> getAssetThumbnail(String assetId,) async {
    final response = await getAssetThumbnailWithHttpInfo(assetId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'Object',) as Object;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /asset/allLocation' operation and returns the [Response].
  Future<Response> getCuratedLocationsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/asset/allLocation';

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

  Future<List<CuratedLocationsResponseDto>?> getCuratedLocations() async {
    final response = await getCuratedLocationsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<CuratedLocationsResponseDto>') as List)
        .cast<CuratedLocationsResponseDto>()
        .toList();

    }
    return null;
  }

  /// Performs an HTTP 'GET /asset/allObjects' operation and returns the [Response].
  Future<Response> getCuratedObjectsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/asset/allObjects';

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

  Future<List<CuratedObjectsResponseDto>?> getCuratedObjects() async {
    final response = await getCuratedObjectsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<CuratedObjectsResponseDto>') as List)
        .cast<CuratedObjectsResponseDto>()
        .toList();

    }
    return null;
  }

  /// 
  ///
  /// Get all asset of a device that are in the database, ID only.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] deviceId (required):
  Future<Response> getUserAssetsByDeviceIdWithHttpInfo(String deviceId,) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/{deviceId}'
      .replaceAll('{deviceId}', deviceId);

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
  ///
  /// Get all asset of a device that are in the database, ID only.
  ///
  /// Parameters:
  ///
  /// * [String] deviceId (required):
  Future<List<String>?> getUserAssetsByDeviceId(String deviceId,) async {
    final response = await getUserAssetsByDeviceIdWithHttpInfo(deviceId,);
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
        .toList();

    }
    return null;
  }

  /// Performs an HTTP 'POST /asset/search' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [SearchAssetDto] searchAssetDto (required):
  Future<Response> searchAssetWithHttpInfo(SearchAssetDto searchAssetDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/search';

    // ignore: prefer_final_locals
    Object? postBody = searchAssetDto;

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
  /// * [SearchAssetDto] searchAssetDto (required):
  Future<List<AssetResponseDto>?> searchAsset(SearchAssetDto searchAssetDto,) async {
    final response = await searchAssetWithHttpInfo(searchAssetDto,);
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
        .toList();

    }
    return null;
  }

  /// Performs an HTTP 'GET /asset/file' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] aid (required):
  ///
  /// * [String] did (required):
  ///
  /// * [bool] isThumb:
  ///
  /// * [bool] isWeb:
  Future<Response> serveFileWithHttpInfo(String aid, String did, { bool? isThumb, bool? isWeb, }) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/file';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'aid', aid));
      queryParams.addAll(_queryParams('', 'did', did));
    if (isThumb != null) {
      queryParams.addAll(_queryParams('', 'isThumb', isThumb));
    }
    if (isWeb != null) {
      queryParams.addAll(_queryParams('', 'isWeb', isWeb));
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
  /// * [String] aid (required):
  ///
  /// * [String] did (required):
  ///
  /// * [bool] isThumb:
  ///
  /// * [bool] isWeb:
  Future<Object?> serveFile(String aid, String did, { bool? isThumb, bool? isWeb, }) async {
    final response = await serveFileWithHttpInfo(aid, did,  isThumb: isThumb, isWeb: isWeb, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'Object',) as Object;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /asset/upload' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [MultipartFile] assetData (required):
  Future<Response> uploadFileWithHttpInfo(MultipartFile assetData,) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/upload';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['multipart/form-data'];

    bool hasFields = false;
    final mp = MultipartRequest('POST', Uri.parse(path));
    if (assetData != null) {
      hasFields = true;
      mp.fields[r'assetData'] = assetData.field;
      mp.files.add(assetData);
    }
    if (hasFields) {
      postBody = mp;
    }

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
  /// * [MultipartFile] assetData (required):
  Future<AssetFileUploadResponseDto?> uploadFile(MultipartFile assetData,) async {
    final response = await uploadFileWithHttpInfo(assetData,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetFileUploadResponseDto',) as AssetFileUploadResponseDto;
    
    }
    return null;
  }
}
