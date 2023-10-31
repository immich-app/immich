//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ActivityApi {
  ActivityApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'POST /activity/comment' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [ActivityCommentDto] activityCommentDto (required):
  Future<Response> addCommentWithHttpInfo(ActivityCommentDto activityCommentDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/activity/comment';

    // ignore: prefer_final_locals
    Object? postBody = activityCommentDto;

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
  /// * [ActivityCommentDto] activityCommentDto (required):
  Future<ActivityResponseDto?> addComment(ActivityCommentDto activityCommentDto,) async {
    final response = await addCommentWithHttpInfo(activityCommentDto,);
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

  /// Performs an HTTP 'PUT /activity/like' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [ActivityDto] activityDto (required):
  Future<Response> createLikeWithHttpInfo(ActivityDto activityDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/activity/like';

    // ignore: prefer_final_locals
    Object? postBody = activityDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
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
  /// * [ActivityDto] activityDto (required):
  Future<ActivityResponseDto?> createLike(ActivityDto activityDto,) async {
    final response = await createLikeWithHttpInfo(activityDto,);
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

  /// Performs an HTTP 'DELETE /activity/comment/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteCommentWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final path = r'/activity/comment/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> deleteComment(String id,) async {
    final response = await deleteCommentWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'DELETE /activity/like' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [ActivityDto] activityDto (required):
  Future<Response> deleteLikeWithHttpInfo(ActivityDto activityDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/activity/like';

    // ignore: prefer_final_locals
    Object? postBody = activityDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [ActivityDto] activityDto (required):
  Future<void> deleteLike(ActivityDto activityDto,) async {
    final response = await deleteLikeWithHttpInfo(activityDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'GET /activity' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [String] assetId:
  Future<Response> getActivitiesWithHttpInfo(String albumId, { String? assetId, }) async {
    // ignore: prefer_const_declarations
    final path = r'/activity';

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
      path,
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
  /// * [String] albumId (required):
  ///
  /// * [String] assetId:
  Future<List<ActivityResponseDto>?> getActivities(String albumId, { String? assetId, }) async {
    final response = await getActivitiesWithHttpInfo(albumId,  assetId: assetId, );
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
        .toList();

    }
    return null;
  }

  /// Performs an HTTP 'GET /activity/like' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [String] assetId:
  Future<Response> getActivityLikeStatusWithHttpInfo(String albumId, { String? assetId, }) async {
    // ignore: prefer_const_declarations
    final path = r'/activity/like';

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
      path,
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
  /// * [String] albumId (required):
  ///
  /// * [String] assetId:
  Future<Object?> getActivityLikeStatus(String albumId, { String? assetId, }) async {
    final response = await getActivityLikeStatusWithHttpInfo(albumId,  assetId: assetId, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'Object',) as Object;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /activity/statistics' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [String] assetId:
  Future<Response> getActivityStatisticsWithHttpInfo(String albumId, { String? assetId, }) async {
    // ignore: prefer_const_declarations
    final path = r'/activity/statistics';

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
      path,
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
