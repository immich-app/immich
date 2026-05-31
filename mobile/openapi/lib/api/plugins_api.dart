// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class PluginsApi {
  PluginsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion searchPluginsAddedIn = .new(3, 0, 0);

  static const ApiState searchPluginsState = .added;

  static const ApiVersion searchPluginMethodsAddedIn = .new(3, 0, 0);

  static const ApiState searchPluginMethodsState = .added;

  static const ApiVersion searchPluginTemplatesAddedIn = .new(3, 0, 0);

  static const ApiState searchPluginTemplatesState = .added;

  static const ApiVersion getPluginAddedIn = .new(3, 0, 0);

  static const ApiState getPluginState = .added;

  /// List all plugins
  ///
  /// Retrieve a list of plugins available to the authenticated user.
  ///
  /// Available since server v3.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> searchPluginsWithHttpInfo({
    String? description,
    bool? enabled,
    String? id,
    String? name,
    String? title,
    String? version,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/plugins';

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
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// List all plugins
  ///
  /// Retrieve a list of plugins available to the authenticated user.
  ///
  /// Available since server v3.0.0.
  Future<List<PluginResponseDto>> searchPlugins({
    String? description,
    bool? enabled,
    String? id,
    String? name,
    String? title,
    String? version,
    Future<void>? abortTrigger,
  }) async {
    final response = await searchPluginsWithHttpInfo(
      description: description,
      enabled: enabled,
      id: id,
      name: name,
      title: title,
      version: version,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<PluginResponseDto>') as List)
          .cast<PluginResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve plugin methods
  ///
  /// Retrieve a list of plugin methods
  ///
  /// Available since server v3.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> searchPluginMethodsWithHttpInfo({
    String? description,
    bool? enabled,
    String? id,
    String? name,
    String? pluginName,
    String? pluginVersion,
    String? title,
    WorkflowTrigger? trigger,
    WorkflowType? type,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/plugins/methods';

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
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve plugin methods
  ///
  /// Retrieve a list of plugin methods
  ///
  /// Available since server v3.0.0.
  Future<List<PluginMethodResponseDto>> searchPluginMethods({
    String? description,
    bool? enabled,
    String? id,
    String? name,
    String? pluginName,
    String? pluginVersion,
    String? title,
    WorkflowTrigger? trigger,
    WorkflowType? type,
    Future<void>? abortTrigger,
  }) async {
    final response = await searchPluginMethodsWithHttpInfo(
      description: description,
      enabled: enabled,
      id: id,
      name: name,
      pluginName: pluginName,
      pluginVersion: pluginVersion,
      title: title,
      trigger: trigger,
      type: type,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<PluginMethodResponseDto>') as List)
          .cast<PluginMethodResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve workflow templates
  ///
  /// Retrieve workflow templates provided by installed plugins
  ///
  /// Available since server v3.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> searchPluginTemplatesWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/plugins/templates';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve workflow templates
  ///
  /// Retrieve workflow templates provided by installed plugins
  ///
  /// Available since server v3.0.0.
  Future<List<PluginTemplateResponseDto>> searchPluginTemplates({Future<void>? abortTrigger}) async {
    final response = await searchPluginTemplatesWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<PluginTemplateResponseDto>') as List)
          .cast<PluginTemplateResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve a plugin
  ///
  /// Retrieve information about a specific plugin by its ID.
  ///
  /// Available since server v3.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getPluginWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/plugins/{id}'.replaceAll('{id}', id);

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve a plugin
  ///
  /// Retrieve information about a specific plugin by its ID.
  ///
  /// Available since server v3.0.0.
  Future<PluginResponseDto> getPlugin(String id, {Future<void>? abortTrigger}) async {
    final response = await getPluginWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'PluginResponseDto')
          as PluginResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
