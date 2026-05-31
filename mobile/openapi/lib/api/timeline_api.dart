// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class TimelineApi {
  TimelineApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion getTimeBucketAddedIn = .new(1, 0, 0);

  static const ApiState getTimeBucketState = .internal;

  static const ApiVersion getTimeBucketsAddedIn = .new(1, 0, 0);

  static const ApiState getTimeBucketsState = .internal;

  /// Get time bucket
  ///
  /// Retrieve a string of all asset ids in a given time bucket.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getTimeBucketWithHttpInfo({
    String? albumId,
    String? bbox,
    bool? isFavorite,
    bool? isTrashed,
    String? key,
    AssetOrder? order,
    AssetOrderBy? orderBy,
    String? personId,
    String? slug,
    String? tagId,
    required String timeBucket,
    String? userId,
    AssetVisibility? visibility,
    bool? withCoordinates,
    bool? withPartners,
    bool? withStacked,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/timeline/bucket';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (albumId != null) {
      queryParams.addAll(_queryParams('', 'albumId', albumId));
    }
    if (bbox != null) {
      queryParams.addAll(_queryParams('', 'bbox', bbox));
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
    if (orderBy != null) {
      queryParams.addAll(_queryParams('', 'orderBy', orderBy));
    }
    if (personId != null) {
      queryParams.addAll(_queryParams('', 'personId', personId));
    }
    if (slug != null) {
      queryParams.addAll(_queryParams('', 'slug', slug));
    }
    if (tagId != null) {
      queryParams.addAll(_queryParams('', 'tagId', tagId));
    }
    queryParams.addAll(_queryParams('', 'timeBucket', timeBucket));
    if (userId != null) {
      queryParams.addAll(_queryParams('', 'userId', userId));
    }
    if (visibility != null) {
      queryParams.addAll(_queryParams('', 'visibility', visibility));
    }
    if (withCoordinates != null) {
      queryParams.addAll(_queryParams('', 'withCoordinates', withCoordinates));
    }
    if (withPartners != null) {
      queryParams.addAll(_queryParams('', 'withPartners', withPartners));
    }
    if (withStacked != null) {
      queryParams.addAll(_queryParams('', 'withStacked', withStacked));
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

  /// Get time bucket
  ///
  /// Retrieve a string of all asset ids in a given time bucket.
  ///
  /// Available since server v1.0.0.
  Future<TimeBucketAssetResponseDto> getTimeBucket({
    String? albumId,
    String? bbox,
    bool? isFavorite,
    bool? isTrashed,
    String? key,
    AssetOrder? order,
    AssetOrderBy? orderBy,
    String? personId,
    String? slug,
    String? tagId,
    required String timeBucket,
    String? userId,
    AssetVisibility? visibility,
    bool? withCoordinates,
    bool? withPartners,
    bool? withStacked,
    Future<void>? abortTrigger,
  }) async {
    final response = await getTimeBucketWithHttpInfo(
      albumId: albumId,
      bbox: bbox,
      isFavorite: isFavorite,
      isTrashed: isTrashed,
      key: key,
      order: order,
      orderBy: orderBy,
      personId: personId,
      slug: slug,
      tagId: tagId,
      timeBucket: timeBucket,
      userId: userId,
      visibility: visibility,
      withCoordinates: withCoordinates,
      withPartners: withPartners,
      withStacked: withStacked,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'TimeBucketAssetResponseDto')
          as TimeBucketAssetResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Get time buckets
  ///
  /// Retrieve a list of all minimal time buckets.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getTimeBucketsWithHttpInfo({
    String? albumId,
    String? bbox,
    bool? isFavorite,
    bool? isTrashed,
    String? key,
    AssetOrder? order,
    AssetOrderBy? orderBy,
    String? personId,
    String? slug,
    String? tagId,
    String? userId,
    AssetVisibility? visibility,
    bool? withCoordinates,
    bool? withPartners,
    bool? withStacked,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/timeline/buckets';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (albumId != null) {
      queryParams.addAll(_queryParams('', 'albumId', albumId));
    }
    if (bbox != null) {
      queryParams.addAll(_queryParams('', 'bbox', bbox));
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
    if (orderBy != null) {
      queryParams.addAll(_queryParams('', 'orderBy', orderBy));
    }
    if (personId != null) {
      queryParams.addAll(_queryParams('', 'personId', personId));
    }
    if (slug != null) {
      queryParams.addAll(_queryParams('', 'slug', slug));
    }
    if (tagId != null) {
      queryParams.addAll(_queryParams('', 'tagId', tagId));
    }
    if (userId != null) {
      queryParams.addAll(_queryParams('', 'userId', userId));
    }
    if (visibility != null) {
      queryParams.addAll(_queryParams('', 'visibility', visibility));
    }
    if (withCoordinates != null) {
      queryParams.addAll(_queryParams('', 'withCoordinates', withCoordinates));
    }
    if (withPartners != null) {
      queryParams.addAll(_queryParams('', 'withPartners', withPartners));
    }
    if (withStacked != null) {
      queryParams.addAll(_queryParams('', 'withStacked', withStacked));
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

  /// Get time buckets
  ///
  /// Retrieve a list of all minimal time buckets.
  ///
  /// Available since server v1.0.0.
  Future<List<TimeBucketsResponseDto>> getTimeBuckets({
    String? albumId,
    String? bbox,
    bool? isFavorite,
    bool? isTrashed,
    String? key,
    AssetOrder? order,
    AssetOrderBy? orderBy,
    String? personId,
    String? slug,
    String? tagId,
    String? userId,
    AssetVisibility? visibility,
    bool? withCoordinates,
    bool? withPartners,
    bool? withStacked,
    Future<void>? abortTrigger,
  }) async {
    final response = await getTimeBucketsWithHttpInfo(
      albumId: albumId,
      bbox: bbox,
      isFavorite: isFavorite,
      isTrashed: isTrashed,
      key: key,
      order: order,
      orderBy: orderBy,
      personId: personId,
      slug: slug,
      tagId: tagId,
      userId: userId,
      visibility: visibility,
      withCoordinates: withCoordinates,
      withPartners: withPartners,
      withStacked: withStacked,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<TimeBucketsResponseDto>') as List)
          .cast<TimeBucketsResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
