//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class DeprecatedApi {
  DeprecatedApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Create a partner
  ///
  /// Create a new partner to share assets with.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> createPartnerDeprecatedWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/partners/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

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

  /// Create a partner
  ///
  /// Create a new partner to share assets with.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<PartnerResponseDto?> createPartnerDeprecated(String id,) async {
    final response = await createPartnerDeprecatedWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'PartnerResponseDto',) as PartnerResponseDto;
    
    }
    return null;
  }

  /// Retrieve assets by device ID
  ///
  /// Get all asset of a device that are in the database, ID only.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] deviceId (required):
  ///   Device ID
  Future<Response> getAllUserAssetsByDeviceIdWithHttpInfo(String deviceId,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/device/{deviceId}'
      .replaceAll('{deviceId}', deviceId);

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

  /// Retrieve assets by device ID
  ///
  /// Get all asset of a device that are in the database, ID only.
  ///
  /// Parameters:
  ///
  /// * [String] deviceId (required):
  ///   Device ID
  Future<List<String>?> getAllUserAssetsByDeviceId(String deviceId,) async {
    final response = await getAllUserAssetsByDeviceIdWithHttpInfo(deviceId,);
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

  /// Get delta sync for user
  ///
  /// Retrieve changed assets since the last sync for the authenticated user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [AssetDeltaSyncDto] assetDeltaSyncDto (required):
  Future<Response> getDeltaSyncWithHttpInfo(AssetDeltaSyncDto assetDeltaSyncDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sync/delta-sync';

    // ignore: prefer_final_locals
    Object? postBody = assetDeltaSyncDto;

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

  /// Get delta sync for user
  ///
  /// Retrieve changed assets since the last sync for the authenticated user.
  ///
  /// Parameters:
  ///
  /// * [AssetDeltaSyncDto] assetDeltaSyncDto (required):
  Future<AssetDeltaSyncResponseDto?> getDeltaSync(AssetDeltaSyncDto assetDeltaSyncDto,) async {
    final response = await getDeltaSyncWithHttpInfo(assetDeltaSyncDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetDeltaSyncResponseDto',) as AssetDeltaSyncResponseDto;
    
    }
    return null;
  }

  /// Get full sync for user
  ///
  /// Retrieve all assets for a full synchronization for the authenticated user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [AssetFullSyncDto] assetFullSyncDto (required):
  Future<Response> getFullSyncForUserWithHttpInfo(AssetFullSyncDto assetFullSyncDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sync/full-sync';

    // ignore: prefer_final_locals
    Object? postBody = assetFullSyncDto;

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

  /// Get full sync for user
  ///
  /// Retrieve all assets for a full synchronization for the authenticated user.
  ///
  /// Parameters:
  ///
  /// * [AssetFullSyncDto] assetFullSyncDto (required):
  Future<List<AssetResponseDto>?> getFullSyncForUser(AssetFullSyncDto assetFullSyncDto,) async {
    final response = await getFullSyncForUserWithHttpInfo(assetFullSyncDto,);
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
}
