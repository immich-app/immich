//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ActivitiesApi {
  ActivitiesApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Create an activity
  ///
  /// Create a like or a comment for an album, or an asset in an album.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [ActivityCreateDto] activityCreateDto (required):
  Future<Response> createActivityWithHttpInfo(ActivityCreateDto activityCreateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/activities';

    // ignore: prefer_final_locals
    Object? postBody = activityCreateDto;

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

  /// Create an activity
  ///
  /// Create a like or a comment for an album, or an asset in an album.
  ///
  /// Parameters:
  ///
  /// * [ActivityCreateDto] activityCreateDto (required):
  Future<ActivityResponseDto?> createActivity(ActivityCreateDto activityCreateDto,) async {
    final response = await createActivityWithHttpInfo(activityCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ActivityResponseDto',) as ActivityResponseDto;
    
    }
    return null;
  }

  /// Delete an activity
  ///
  /// Removes a like or comment from a given album or asset in an album.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteActivityWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/activities/{id}'
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

  /// Delete an activity
  ///
  /// Removes a like or comment from a given album or asset in an album.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> deleteActivity(String id,) async {
    final response = await deleteActivityWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// List all activities
  ///
  /// Returns a list of activities for the selected asset or album. The activities are returned in sorted order, with the oldest activities appearing first.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [String] assetId:
  ///
  /// * [ReactionLevel] level:
  ///
  /// * [ReactionType] type:
  ///
  /// * [String] userId:
  Future<Response> getActivitiesWithHttpInfo(String albumId, { String? assetId, ReactionLevel? level, ReactionType? type, String? userId, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/activities';

    // ignore: prefer_final_locals
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
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// List all activities
  ///
  /// Returns a list of activities for the selected asset or album. The activities are returned in sorted order, with the oldest activities appearing first.
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [String] assetId:
  ///
  /// * [ReactionLevel] level:
  ///
  /// * [ReactionType] type:
  ///
  /// * [String] userId:
  Future<List<ActivityResponseDto>?> getActivities(String albumId, { String? assetId, ReactionLevel? level, ReactionType? type, String? userId, }) async {
    final response = await getActivitiesWithHttpInfo(albumId,  assetId: assetId, level: level, type: type, userId: userId, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<ActivityResponseDto>') as List)
        .cast<ActivityResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Retrieve activity statistics
  ///
  /// Returns the number of likes and comments for a given album or asset in an album.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [String] assetId:
  Future<Response> getActivityStatisticsWithHttpInfo(String albumId, { String? assetId, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/activities/statistics';

    // ignore: prefer_final_locals
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
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Retrieve activity statistics
  ///
  /// Returns the number of likes and comments for a given album or asset in an album.
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [String] assetId:
  Future<ActivityStatisticsResponseDto?> getActivityStatistics(String albumId, { String? assetId, }) async {
    final response = await getActivityStatisticsWithHttpInfo(albumId,  assetId: assetId, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ActivityStatisticsResponseDto',) as ActivityStatisticsResponseDto;
    
    }
    return null;
  }
}
