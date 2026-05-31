// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class ActivitiesApi {
  ActivitiesApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion getActivitiesAddedIn = .new(1, 0, 0);

  static const ApiState getActivitiesState = .stable;

  static const ApiVersion createActivityAddedIn = .new(1, 0, 0);

  static const ApiState createActivityState = .stable;

  static const ApiVersion getActivityStatisticsAddedIn = .new(1, 0, 0);

  static const ApiState getActivityStatisticsState = .stable;

  static const ApiVersion deleteActivityAddedIn = .new(1, 0, 0);

  static const ApiState deleteActivityState = .stable;

  /// List all activities
  ///
  /// Returns a list of activities for the selected asset or album. The activities are returned in sorted order, with the oldest activities appearing first.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getActivitiesWithHttpInfo({
    required String albumId,
    String? assetId,
    ReactionLevel? level,
    ReactionType? type,
    String? userId,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/activities';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    queryParams.addAll(_queryParams('', 'albumId', albumId));
    if (assetId != null) {
      queryParams.addAll(_queryParams('', 'assetId', assetId));
    }
    if (level != null) {
      queryParams.addAll(_queryParams('', 'level', level));
    }
    if (type != null) {
      queryParams.addAll(_queryParams('', 'type', type));
    }
    if (userId != null) {
      queryParams.addAll(_queryParams('', 'userId', userId));
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

  /// List all activities
  ///
  /// Returns a list of activities for the selected asset or album. The activities are returned in sorted order, with the oldest activities appearing first.
  ///
  /// Available since server v1.0.0.
  Future<List<ActivityResponseDto>> getActivities({
    required String albumId,
    String? assetId,
    ReactionLevel? level,
    ReactionType? type,
    String? userId,
    Future<void>? abortTrigger,
  }) async {
    final response = await getActivitiesWithHttpInfo(
      albumId: albumId,
      assetId: assetId,
      level: level,
      type: type,
      userId: userId,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<ActivityResponseDto>') as List)
          .cast<ActivityResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Create an activity
  ///
  /// Create a like or a comment for an album, or an asset in an album.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> createActivityWithHttpInfo(ActivityCreateDto activityCreateDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/activities';

    Object? postBody = activityCreateDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

    return apiClient.invokeAPI(
      apiPath,
      r'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Create an activity
  ///
  /// Create a like or a comment for an album, or an asset in an album.
  ///
  /// Available since server v1.0.0.
  Future<ActivityResponseDto> createActivity(ActivityCreateDto activityCreateDto, {Future<void>? abortTrigger}) async {
    final response = await createActivityWithHttpInfo(activityCreateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'ActivityResponseDto')
          as ActivityResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve activity statistics
  ///
  /// Returns the number of likes and comments for a given album or asset in an album.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getActivityStatisticsWithHttpInfo({
    required String albumId,
    String? assetId,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/activities/statistics';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    queryParams.addAll(_queryParams('', 'albumId', albumId));
    if (assetId != null) {
      queryParams.addAll(_queryParams('', 'assetId', assetId));
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

  /// Retrieve activity statistics
  ///
  /// Returns the number of likes and comments for a given album or asset in an album.
  ///
  /// Available since server v1.0.0.
  Future<ActivityStatisticsResponseDto> getActivityStatistics({
    required String albumId,
    String? assetId,
    Future<void>? abortTrigger,
  }) async {
    final response = await getActivityStatisticsWithHttpInfo(
      albumId: albumId,
      assetId: assetId,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'ActivityStatisticsResponseDto')
          as ActivityStatisticsResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Delete an activity
  ///
  /// Removes a like or comment from a given album or asset in an album.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteActivityWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/activities/{id}'.replaceAll('{id}', id);

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Delete an activity
  ///
  /// Removes a like or comment from a given album or asset in an album.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteActivity(String id, {Future<void>? abortTrigger}) async {
    final response = await deleteActivityWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
