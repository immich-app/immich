//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class TimelineApi {
  TimelineApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'GET /timeline/bucket' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [TimeBucketSize] size (required):
  ///
  /// * [String] timeBucket (required):
  ///
  /// * [String] albumId:
  ///
  /// * [bool] isArchived:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] isTrashed:
  ///
  /// * [String] key:
  ///
  /// * [AssetOrder] order:
  ///
  /// * [String] personId:
  ///
  /// * [String] tagId:
  ///
  /// * [String] userId:
  ///
  /// * [bool] withPartners:
  ///
  /// * [bool] withStacked:
  Future<Response> getTimeBucketWithHttpInfo(TimeBucketSize size, String timeBucket, { String? albumId, bool? isArchived, bool? isFavorite, bool? isTrashed, String? key, AssetOrder? order, String? personId, String? tagId, String? userId, bool? withPartners, bool? withStacked, }) async {
    // ignore: prefer_const_declarations
    final path = r'/timeline/bucket';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (albumId != null) {
      queryParams.addAll(_queryParams('', 'albumId', albumId));
    }
    if (isArchived != null) {
      queryParams.addAll(_queryParams('', 'isArchived', isArchived));
    }
    if (isFavorite != null) {
      queryParams.addAll(_queryParams('', 'isFavorite', isFavorite));
    }
    if (isTrashed != null) {
      queryParams.addAll(_queryParams('', 'isTrashed', isTrashed));
    }
    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }
    if (order != null) {
      queryParams.addAll(_queryParams('', 'order', order));
    }
    if (personId != null) {
      queryParams.addAll(_queryParams('', 'personId', personId));
    }
      queryParams.addAll(_queryParams('', 'size', size));
    if (tagId != null) {
      queryParams.addAll(_queryParams('', 'tagId', tagId));
    }
      queryParams.addAll(_queryParams('', 'timeBucket', timeBucket));
    if (userId != null) {
      queryParams.addAll(_queryParams('', 'userId', userId));
    }
    if (withPartners != null) {
      queryParams.addAll(_queryParams('', 'withPartners', withPartners));
    }
    if (withStacked != null) {
      queryParams.addAll(_queryParams('', 'withStacked', withStacked));
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
  /// * [TimeBucketSize] size (required):
  ///
  /// * [String] timeBucket (required):
  ///
  /// * [String] albumId:
  ///
  /// * [bool] isArchived:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] isTrashed:
  ///
  /// * [String] key:
  ///
  /// * [AssetOrder] order:
  ///
  /// * [String] personId:
  ///
  /// * [String] tagId:
  ///
  /// * [String] userId:
  ///
  /// * [bool] withPartners:
  ///
  /// * [bool] withStacked:
  Future<List<AssetResponseDto>?> getTimeBucket(TimeBucketSize size, String timeBucket, { String? albumId, bool? isArchived, bool? isFavorite, bool? isTrashed, String? key, AssetOrder? order, String? personId, String? tagId, String? userId, bool? withPartners, bool? withStacked, }) async {
    final response = await getTimeBucketWithHttpInfo(size, timeBucket,  albumId: albumId, isArchived: isArchived, isFavorite: isFavorite, isTrashed: isTrashed, key: key, order: order, personId: personId, tagId: tagId, userId: userId, withPartners: withPartners, withStacked: withStacked, );
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

  /// Performs an HTTP 'GET /timeline/buckets' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [TimeBucketSize] size (required):
  ///
  /// * [String] albumId:
  ///
  /// * [bool] isArchived:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] isTrashed:
  ///
  /// * [String] key:
  ///
  /// * [AssetOrder] order:
  ///
  /// * [String] personId:
  ///
  /// * [String] tagId:
  ///
  /// * [String] userId:
  ///
  /// * [bool] withPartners:
  ///
  /// * [bool] withStacked:
  Future<Response> getTimeBucketsWithHttpInfo(TimeBucketSize size, { String? albumId, bool? isArchived, bool? isFavorite, bool? isTrashed, String? key, AssetOrder? order, String? personId, String? tagId, String? userId, bool? withPartners, bool? withStacked, }) async {
    // ignore: prefer_const_declarations
    final path = r'/timeline/buckets';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (albumId != null) {
      queryParams.addAll(_queryParams('', 'albumId', albumId));
    }
    if (isArchived != null) {
      queryParams.addAll(_queryParams('', 'isArchived', isArchived));
    }
    if (isFavorite != null) {
      queryParams.addAll(_queryParams('', 'isFavorite', isFavorite));
    }
    if (isTrashed != null) {
      queryParams.addAll(_queryParams('', 'isTrashed', isTrashed));
    }
    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }
    if (order != null) {
      queryParams.addAll(_queryParams('', 'order', order));
    }
    if (personId != null) {
      queryParams.addAll(_queryParams('', 'personId', personId));
    }
      queryParams.addAll(_queryParams('', 'size', size));
    if (tagId != null) {
      queryParams.addAll(_queryParams('', 'tagId', tagId));
    }
    if (userId != null) {
      queryParams.addAll(_queryParams('', 'userId', userId));
    }
    if (withPartners != null) {
      queryParams.addAll(_queryParams('', 'withPartners', withPartners));
    }
    if (withStacked != null) {
      queryParams.addAll(_queryParams('', 'withStacked', withStacked));
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
  /// * [TimeBucketSize] size (required):
  ///
  /// * [String] albumId:
  ///
  /// * [bool] isArchived:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] isTrashed:
  ///
  /// * [String] key:
  ///
  /// * [AssetOrder] order:
  ///
  /// * [String] personId:
  ///
  /// * [String] tagId:
  ///
  /// * [String] userId:
  ///
  /// * [bool] withPartners:
  ///
  /// * [bool] withStacked:
  Future<List<TimeBucketResponseDto>?> getTimeBuckets(TimeBucketSize size, { String? albumId, bool? isArchived, bool? isFavorite, bool? isTrashed, String? key, AssetOrder? order, String? personId, String? tagId, String? userId, bool? withPartners, bool? withStacked, }) async {
    final response = await getTimeBucketsWithHttpInfo(size,  albumId: albumId, isArchived: isArchived, isFavorite: isFavorite, isTrashed: isTrashed, key: key, order: order, personId: personId, tagId: tagId, userId: userId, withPartners: withPartners, withStacked: withStacked, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<TimeBucketResponseDto>') as List)
        .cast<TimeBucketResponseDto>()
        .toList(growable: false);

    }
    return null;
  }
}
