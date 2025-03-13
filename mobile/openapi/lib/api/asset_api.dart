//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AssetApi {
  AssetApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'POST /asset-parts/{sha1}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] sha1 (required):
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
  /// * [String] duration:
  ///
  /// * [bool] isArchived:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] isVisible:
  ///
  /// * [String] livePhotoVideoId:
  ///
  /// * [MultipartFile] sidecarData:
  Future<Response> createAssetFromPartsWithHttpInfo(String sha1, MultipartFile assetData, String deviceAssetId, String deviceId, DateTime fileCreatedAt, DateTime fileModifiedAt, { String? key, String? duration, bool? isArchived, bool? isFavorite, bool? isVisible, String? livePhotoVideoId, MultipartFile? sidecarData, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/asset-parts/{sha1}'
      .replaceAll('{sha1}', sha1);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }

    const contentTypes = <String>['multipart/form-data'];

    bool hasFields = false;
    final mp = MultipartRequest('POST', Uri.parse(apiPath));
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
    if (isArchived != null) {
      hasFields = true;
      mp.fields[r'isArchived'] = parameterToString(isArchived);
    }
    if (isFavorite != null) {
      hasFields = true;
      mp.fields[r'isFavorite'] = parameterToString(isFavorite);
    }
    if (isVisible != null) {
      hasFields = true;
      mp.fields[r'isVisible'] = parameterToString(isVisible);
    }
    if (livePhotoVideoId != null) {
      hasFields = true;
      mp.fields[r'livePhotoVideoId'] = parameterToString(livePhotoVideoId);
    }
    if (sidecarData != null) {
      hasFields = true;
      mp.fields[r'sidecarData'] = sidecarData.field;
      mp.files.add(sidecarData);
    }
    if (hasFields) {
      postBody = mp;
    }

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

  /// Parameters:
  ///
  /// * [String] sha1 (required):
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
  /// * [String] duration:
  ///
  /// * [bool] isArchived:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] isVisible:
  ///
  /// * [String] livePhotoVideoId:
  ///
  /// * [MultipartFile] sidecarData:
  Future<AssetMediaResponseDto?> createAssetFromParts(String sha1, MultipartFile assetData, String deviceAssetId, String deviceId, DateTime fileCreatedAt, DateTime fileModifiedAt, { String? key, String? duration, bool? isArchived, bool? isFavorite, bool? isVisible, String? livePhotoVideoId, MultipartFile? sidecarData, }) async {
    final response = await createAssetFromPartsWithHttpInfo(sha1, assetData, deviceAssetId, deviceId, fileCreatedAt, fileModifiedAt,  key: key, duration: duration, isArchived: isArchived, isFavorite: isFavorite, isVisible: isVisible, livePhotoVideoId: livePhotoVideoId, sidecarData: sidecarData, );
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

  /// Performs an HTTP 'GET /asset-parts/{sha1}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] sha1 (required):
  Future<Response> getPartsWithHttpInfo(String sha1,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/asset-parts/{sha1}'
      .replaceAll('{sha1}', sha1);

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

  /// Parameters:
  ///
  /// * [String] sha1 (required):
  Future<List<PartInfoDto>?> getParts(String sha1,) async {
    final response = await getPartsWithHttpInfo(sha1,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<PartInfoDto>') as List)
        .cast<PartInfoDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Performs an HTTP 'PUT /asset-parts/{sha1}/{partNo}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [num] partNo (required):
  ///
  /// * [String] sha1 (required):
  Future<Response> uploadPartWithHttpInfo(num partNo, String sha1,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/asset-parts/{sha1}/{partNo}'
      .replaceAll('{partNo}', partNo.toString())
      .replaceAll('{sha1}', sha1);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


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

  /// Parameters:
  ///
  /// * [num] partNo (required):
  ///
  /// * [String] sha1 (required):
  Future<void> uploadPart(num partNo, String sha1,) async {
    final response = await uploadPartWithHttpInfo(partNo, sha1,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
