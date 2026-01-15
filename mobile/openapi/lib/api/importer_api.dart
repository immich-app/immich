//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ImporterApi {
  ImporterApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Create a setup token for the Google Photos Importer app
  ///
  /// Creates a temporary API key and setup token that can be used to configure the desktop importer app. The token is valid for 30 days.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> createSetupTokenWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/importer/setup-token';

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

  /// Create a setup token for the Google Photos Importer app
  ///
  /// Creates a temporary API key and setup token that can be used to configure the desktop importer app. The token is valid for 30 days.
  Future<SetupTokenResponseDto?> createSetupToken() async {
    final response = await createSetupTokenWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SetupTokenResponseDto',) as SetupTokenResponseDto;
    
    }
    return null;
  }

  /// Download bootstrap binary
  ///
  /// Downloads a personalized bootstrap binary for the specified platform. The binary has the server URL and setup token embedded.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] platform (required):
  ///
  /// * [String] token (required):
  Future<Response> getBootstrapWithHttpInfo(String platform, String token,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/importer/bootstrap/{token}/{platform}'
      .replaceAll('{platform}', platform)
      .replaceAll('{token}', token);

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

  /// Download bootstrap binary
  ///
  /// Downloads a personalized bootstrap binary for the specified platform. The binary has the server URL and setup token embedded.
  ///
  /// Parameters:
  ///
  /// * [String] platform (required):
  ///
  /// * [String] token (required):
  Future<void> getBootstrap(String platform, String token,) async {
    final response = await getBootstrapWithHttpInfo(platform, token,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Get importer configuration
  ///
  /// Returns the server URL, API key, and OAuth credentials for the desktop importer app. This endpoint is called by the desktop app after receiving the setup token.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] token (required):
  Future<Response> getImporterConfigWithHttpInfo(String token,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/importer/config/{token}'
      .replaceAll('{token}', token);

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

  /// Get importer configuration
  ///
  /// Returns the server URL, API key, and OAuth credentials for the desktop importer app. This endpoint is called by the desktop app after receiving the setup token.
  ///
  /// Parameters:
  ///
  /// * [String] token (required):
  Future<ImporterConfigResponseDto?> getImporterConfig(String token,) async {
    final response = await getImporterConfigWithHttpInfo(token,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ImporterConfigResponseDto',) as ImporterConfigResponseDto;
    
    }
    return null;
  }
}
