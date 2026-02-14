//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AssetFilesApi {
  AssetFilesApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Delete an asset file
  ///
  /// Delete a file and remove it from the database.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteAssetFileWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/asset-files/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Delete an asset file
  ///
  /// Delete a file and remove it from the database.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> deleteAssetFile(String id,) async {
    final response = await deleteAssetFileWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Download an asset file
  ///
  /// Serve the contents of a specific asset file.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> downloadAssetFileWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/asset-files/{id}/download'
      .replaceAll('{id}', id);

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

  /// Download an asset file
  ///
  /// Serve the contents of a specific asset file.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<MultipartFile?> downloadAssetFile(String id,) async {
    final response = await downloadAssetFileWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'MultipartFile',) as MultipartFile;
    
    }
    return null;
  }

  /// Retrieve an asset file
  ///
  /// Returns a metadata about a specific asset file.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getAssetFileWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/asset-files/{id}'
      .replaceAll('{id}', id);

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

  /// Retrieve an asset file
  ///
  /// Returns a metadata about a specific asset file.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<AssetFileResponseDto?> getAssetFile(String id,) async {
    final response = await getAssetFileWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetFileResponseDto',) as AssetFileResponseDto;
    
    }
    return null;
  }

  /// Retrieve an asset file
  ///
  /// Returns a metadata about a specific asset file.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] assetId (required):
  ///   Asset ID to filter files by
  ///
  /// * [bool] isEdited:
  ///   The file was generated from an edit
  ///
  /// * [bool] isProgressive:
  ///   The file is a progressively encoded JPEG
  ///
  /// * [AssetFileType] type:
  ///   Filter by type of file
  Future<Response> searchAssetFilesWithHttpInfo(String assetId, { bool? isEdited, bool? isProgressive, AssetFileType? type, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/asset-files';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'assetId', assetId));
    if (isEdited != null) {
      queryParams.addAll(_queryParams('', 'isEdited', isEdited));
    }
    if (isProgressive != null) {
      queryParams.addAll(_queryParams('', 'isProgressive', isProgressive));
    }
    if (type != null) {
      queryParams.addAll(_queryParams('', 'type', type));
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

  /// Retrieve an asset file
  ///
  /// Returns a metadata about a specific asset file.
  ///
  /// Parameters:
  ///
  /// * [String] assetId (required):
  ///   Asset ID to filter files by
  ///
  /// * [bool] isEdited:
  ///   The file was generated from an edit
  ///
  /// * [bool] isProgressive:
  ///   The file is a progressively encoded JPEG
  ///
  /// * [AssetFileType] type:
  ///   Filter by type of file
  Future<List<AssetFileResponseDto>?> searchAssetFiles(String assetId, { bool? isEdited, bool? isProgressive, AssetFileType? type, }) async {
    final response = await searchAssetFilesWithHttpInfo(assetId,  isEdited: isEdited, isProgressive: isProgressive, type: type, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<AssetFileResponseDto>') as List)
        .cast<AssetFileResponseDto>()
        .toList(growable: false);

    }
    return null;
  }
}
