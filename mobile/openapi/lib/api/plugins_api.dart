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

  /// Retrieve plugin methods
  ///
  /// Retrieve a list of plugin methods
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] description:
  ///
  /// * [bool] enabled:
  ///   Whether the plugin method is enabled
  ///
  /// * [String] id:
  ///   Plugin method ID
  ///
  /// * [String] name:
  ///
  /// * [String] pluginName:
  ///   Plugin name
  ///
  /// * [String] pluginVersion:
  ///   Plugin version
  ///
  /// * [String] title:
  ///
  /// * [WorkflowTrigger] trigger:
  ///   Workflow trigger
  ///
  /// * [WorkflowType] type:
  ///   Workflow types
  Future<Response> searchPluginMethodsWithHttpInfo({ String? description, bool? enabled, String? id, String? name, String? pluginName, String? pluginVersion, String? title, WorkflowTrigger? trigger, WorkflowType? type, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/plugins/methods';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (description != null) {
      queryParams.addAll(_queryParams('', 'description', description));
    }
    if (enabled != null) {
      queryParams.addAll(_queryParams('', 'enabled', enabled));
    }
    if (id != null) {
      queryParams.addAll(_queryParams('', 'id', id));
    }
    if (name != null) {
      queryParams.addAll(_queryParams('', 'name', name));
    }
    if (pluginName != null) {
      queryParams.addAll(_queryParams('', 'pluginName', pluginName));
    }
    if (pluginVersion != null) {
      queryParams.addAll(_queryParams('', 'pluginVersion', pluginVersion));
    }
    if (title != null) {
      queryParams.addAll(_queryParams('', 'title', title));
    }
    if (trigger != null) {
      queryParams.addAll(_queryParams('', 'trigger', trigger));
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

  /// Retrieve plugin methods
  ///
  /// Retrieve a list of plugin methods
  ///
  /// Parameters:
  ///
  /// * [String] description:
  ///
  /// * [bool] enabled:
  ///   Whether the plugin method is enabled
  ///
  /// * [String] id:
  ///   Plugin method ID
  ///
  /// * [String] name:
  ///
  /// * [String] pluginName:
  ///   Plugin name
  ///
  /// * [String] pluginVersion:
  ///   Plugin version
  ///
  /// * [String] title:
  ///
  /// * [WorkflowTrigger] trigger:
  ///   Workflow trigger
  ///
  /// * [WorkflowType] type:
  ///   Workflow types
  Future<List<PluginMethodResponseDto>?> searchPluginMethods({ String? description, bool? enabled, String? id, String? name, String? pluginName, String? pluginVersion, String? title, WorkflowTrigger? trigger, WorkflowType? type, }) async {
    final response = await searchPluginMethodsWithHttpInfo( description: description, enabled: enabled, id: id, name: name, pluginName: pluginName, pluginVersion: pluginVersion, title: title, trigger: trigger, type: type, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<PluginMethodResponseDto>') as List)
        .cast<PluginMethodResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// List all plugins
  ///
  /// Retrieve a list of plugins available to the authenticated user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] description:
  ///
  /// * [bool] enabled:
  ///   Whether the plugin is enabled
  ///
  /// * [String] id:
  ///   Plugin ID
  ///
  /// * [String] name:
  ///
  /// * [String] title:
  ///
  /// * [String] version:
  Future<Response> searchPluginsWithHttpInfo({ String? description, bool? enabled, String? id, String? name, String? title, String? version, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/plugins';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (description != null) {
      queryParams.addAll(_queryParams('', 'description', description));
    }
    if (enabled != null) {
      queryParams.addAll(_queryParams('', 'enabled', enabled));
    }
    if (id != null) {
      queryParams.addAll(_queryParams('', 'id', id));
    }
    if (name != null) {
      queryParams.addAll(_queryParams('', 'name', name));
    }
    if (title != null) {
      queryParams.addAll(_queryParams('', 'title', title));
    }
    if (version != null) {
      queryParams.addAll(_queryParams('', 'version', version));
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

  /// List all plugins
  ///
  /// Retrieve a list of plugins available to the authenticated user.
  ///
  /// Parameters:
  ///
  /// * [String] description:
  ///
  /// * [bool] enabled:
  ///   Whether the plugin is enabled
  ///
  /// * [String] id:
  ///   Plugin ID
  ///
  /// * [String] name:
  ///
  /// * [String] title:
  ///
  /// * [String] version:
  Future<List<PluginResponseDto>?> searchPlugins({ String? description, bool? enabled, String? id, String? name, String? title, String? version, }) async {
    final response = await searchPluginsWithHttpInfo( description: description, enabled: enabled, id: id, name: name, title: title, version: version, );
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
