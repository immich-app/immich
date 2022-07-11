//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class DeviceInfoApi {
  DeviceInfoApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'POST /device-info' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [CreateDeviceInfoDto] createDeviceInfoDto (required):
  Future<Response> createDeviceInfoWithHttpInfo(CreateDeviceInfoDto createDeviceInfoDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/device-info';

    // ignore: prefer_final_locals
    Object? postBody = createDeviceInfoDto;

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
  /// * [CreateDeviceInfoDto] createDeviceInfoDto (required):
  Future<DeviceInfoResponseDto?> createDeviceInfo(CreateDeviceInfoDto createDeviceInfoDto,) async {
    final response = await createDeviceInfoWithHttpInfo(createDeviceInfoDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'DeviceInfoResponseDto',) as DeviceInfoResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'PATCH /device-info' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [UpdateDeviceInfoDto] updateDeviceInfoDto (required):
  Future<Response> updateDeviceInfoWithHttpInfo(UpdateDeviceInfoDto updateDeviceInfoDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/device-info';

    // ignore: prefer_final_locals
    Object? postBody = updateDeviceInfoDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'PATCH',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [UpdateDeviceInfoDto] updateDeviceInfoDto (required):
  Future<DeviceInfoResponseDto?> updateDeviceInfo(UpdateDeviceInfoDto updateDeviceInfoDto,) async {
    final response = await updateDeviceInfoWithHttpInfo(updateDeviceInfoDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'DeviceInfoResponseDto',) as DeviceInfoResponseDto;
    
    }
    return null;
  }
}
