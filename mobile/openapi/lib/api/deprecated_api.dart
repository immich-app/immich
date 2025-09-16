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

  /// This property was deprecated in v1.141.0. This endpoint requires the `partner.create` permission.
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

  /// This property was deprecated in v1.141.0. This endpoint requires the `partner.create` permission.
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

  /// This property was deprecated in v1.116.0. This endpoint requires the `asset.read` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [num] count:
  Future<Response> getRandomWithHttpInfo({ num? count, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/random';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (count != null) {
      queryParams.addAll(_queryParams('', 'count', count));
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

  /// This property was deprecated in v1.116.0. This endpoint requires the `asset.read` permission.
  ///
  /// Parameters:
  ///
  /// * [num] count:
  Future<List<AssetResponseDto>?> getRandom({ num? count, }) async {
    final response = await getRandomWithHttpInfo( count: count, );
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

  /// Replace the asset with new file, without changing its id
  ///
  /// This property was deprecated in v1.142.0. Replace the asset with new file, without changing its id. This endpoint requires the `asset.replace` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [MultipartFile] assetData (required):
  ///
  /// * [String] deviceAssetId (required):
  ///
  /// * [String] deviceId (required):
  ///
  /// * [DateTime] fileCreatedAt (required):
  ///
  /// * [DateTime] fileModifiedAt (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  ///
  /// * [String] duration:
  ///
  /// * [String] filename:
  Future<Response> replaceAssetWithHttpInfo(String id, MultipartFile assetData, String deviceAssetId, String deviceId, DateTime fileCreatedAt, DateTime fileModifiedAt, { String? key, String? slug, String? duration, String? filename, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}/original'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }
    if (slug != null) {
      queryParams.addAll(_queryParams('', 'slug', slug));
    }

    const contentTypes = <String>['multipart/form-data'];

    bool hasFields = false;
    final mp = MultipartRequest('PUT', Uri.parse(apiPath));
    if (assetData != null) {
      hasFields = true;
      mp.fields[r'assetData'] = assetData.field;
      mp.files.add(assetData);
    }
    if (deviceAssetId != null) {
      hasFields = true;
      mp.fields[r'deviceAssetId'] = parameterToString(deviceAssetId);
    }
    if (deviceId != null) {
      hasFields = true;
      mp.fields[r'deviceId'] = parameterToString(deviceId);
    }
    if (duration != null) {
      hasFields = true;
      mp.fields[r'duration'] = parameterToString(duration);
    }
    if (fileCreatedAt != null) {
      hasFields = true;
      mp.fields[r'fileCreatedAt'] = parameterToString(fileCreatedAt);
    }
    if (fileModifiedAt != null) {
      hasFields = true;
      mp.fields[r'fileModifiedAt'] = parameterToString(fileModifiedAt);
    }
    if (filename != null) {
      hasFields = true;
      mp.fields[r'filename'] = parameterToString(filename);
    }
    if (hasFields) {
      postBody = mp;
    }

    return apiClient.invokeAPI(
      apiPath,
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Replace the asset with new file, without changing its id
  ///
  /// This property was deprecated in v1.142.0. Replace the asset with new file, without changing its id. This endpoint requires the `asset.replace` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [MultipartFile] assetData (required):
  ///
  /// * [String] deviceAssetId (required):
  ///
  /// * [String] deviceId (required):
  ///
  /// * [DateTime] fileCreatedAt (required):
  ///
  /// * [DateTime] fileModifiedAt (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  ///
  /// * [String] duration:
  ///
  /// * [String] filename:
  Future<AssetMediaResponseDto?> replaceAsset(String id, MultipartFile assetData, String deviceAssetId, String deviceId, DateTime fileCreatedAt, DateTime fileModifiedAt, { String? key, String? slug, String? duration, String? filename, }) async {
    final response = await replaceAssetWithHttpInfo(id, assetData, deviceAssetId, deviceId, fileCreatedAt, fileModifiedAt,  key: key, slug: slug, duration: duration, filename: filename, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetMediaResponseDto',) as AssetMediaResponseDto;
    
    }
    return null;
  }
}
