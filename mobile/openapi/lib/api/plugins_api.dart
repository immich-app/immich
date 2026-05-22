//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class PluginsApi {
  PluginsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Retrieve a plugin
  ///
  /// Retrieve information about a specific plugin by its ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getPluginWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/plugins/{id}'
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

  /// Retrieve a plugin
  ///
  /// Retrieve information about a specific plugin by its ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<PluginResponseDto?> getPlugin(String id,) async {
    final response = await getPluginWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'PluginResponseDto',) as PluginResponseDto;
    
    }
    return null;
  }

  /// List all plugin triggers
  ///
  /// Retrieve a list of all available plugin triggers.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getPluginTriggersWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/plugins/triggers';

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

  /// List all plugin triggers
  ///
  /// Retrieve a list of all available plugin triggers.
  Future<List<PluginTriggerResponseDto>?> getPluginTriggers() async {
    final response = await getPluginTriggersWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<PluginTriggerResponseDto>') as List)
        .cast<PluginTriggerResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// List all plugins
  ///
  /// Retrieve a list of plugins available to the authenticated user.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getPluginsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/plugins';

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

  /// List all plugins
  ///
  /// Retrieve a list of plugins available to the authenticated user.
  Future<List<PluginResponseDto>?> getPlugins() async {
    final response = await getPluginsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<PluginResponseDto>') as List)
        .cast<PluginResponseDto>()
        .toList(growable: false);

    }
    return null;
  }
}
