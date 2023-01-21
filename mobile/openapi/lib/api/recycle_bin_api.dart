//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class RecycleBinApi {
  RecycleBinApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Permenantly delete Assets
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [DeleteAssetDto] deleteAssetDto (required):
  Future<Response> deleteRecyleBinAssetsWithHttpInfo(DeleteAssetDto deleteAssetDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/bin/assets';

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

  /// Permenantly delete Assets
  ///
  /// Parameters:
  ///
  /// * [DeleteAssetDto] deleteAssetDto (required):
  Future<List<DeleteAssetResponseDto>?> deleteRecyleBinAssets(DeleteAssetDto deleteAssetDto,) async {
    final response = await deleteRecyleBinAssetsWithHttpInfo(deleteAssetDto,);
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

  /// Empty out bin for User
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> emptyBinWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/bin';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


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

  /// Empty out bin for User
  Future<List<DeleteAssetResponseDto>?> emptyBin() async {
    final response = await emptyBinWithHttpInfo();
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

  /// Get all AssetEntity deleted by user
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAllDeletedAssetsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/bin';

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

  /// Get all AssetEntity deleted by user
  Future<List<AssetResponseDto>?> getAllDeletedAssets() async {
    final response = await getAllDeletedAssetsWithHttpInfo();
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
  /// Note: This method returns the HTTP [Response].
  Future<Response> getRecycleBinConfigWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/bin/config';

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
  Future<RecycleBinConfigResponseDto?> getRecycleBinConfig() async {
    final response = await getRecycleBinConfigWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'RecycleBinConfigResponseDto',) as RecycleBinConfigResponseDto;
    
    }
    return null;
  }

  /// 
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getRecycleBinCountByUserIdWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/bin/count-by-user-id';

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
  Future<AssetCountByUserIdResponseDto?> getRecycleBinCountByUserId() async {
    final response = await getRecycleBinCountByUserIdWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetCountByUserIdResponseDto',) as AssetCountByUserIdResponseDto;
    
    }
    return null;
  }

  /// Restore deleted Assets by User
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [RestoreAssetsDto] restoreAssetsDto (required):
  Future<Response> restoreDeletedAssetsWithHttpInfo(RestoreAssetsDto restoreAssetsDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/bin/assets';

    // ignore: prefer_final_locals
    Object? postBody = restoreAssetsDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Restore deleted Assets by User
  ///
  /// Parameters:
  ///
  /// * [RestoreAssetsDto] restoreAssetsDto (required):
  Future<List<AssetResponseDto>?> restoreDeletedAssets(RestoreAssetsDto restoreAssetsDto,) async {
    final response = await restoreDeletedAssetsWithHttpInfo(restoreAssetsDto,);
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
}
