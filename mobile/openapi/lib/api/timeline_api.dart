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

  /// This endpoint requires the `asset.read` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] timeBucket (required):
  ///   Time bucket identifier in YYYY-MM-DD format (e.g., \"2024-01-01\" for January 2024)
  ///
  /// * [String] albumId:
  ///   Filter assets belonging to a specific album
  ///
  /// * [bool] isFavorite:
  ///   Filter by favorite status (true for favorites only, false for non-favorites only)
  ///
  /// * [bool] isTrashed:
  ///   Filter by trash status (true for trashed assets only, false for non-trashed only)
  ///
  /// * [String] key:
  ///
  /// * [AssetOrder] order:
  ///   Sort order for assets within time buckets (ASC for oldest first, DESC for newest first)
  ///
  /// * [String] personId:
  ///   Filter assets containing a specific person (face recognition)
  ///
  /// * [String] slug:
  ///
  /// * [String] tagId:
  ///   Filter assets with a specific tag
  ///
  /// * [String] userId:
  ///   Filter assets by specific user ID
  ///
  /// * [AssetVisibility] visibility:
  ///   Filter by asset visibility status (ARCHIVE, TIMELINE, HIDDEN, LOCKED)
  ///
  /// * [bool] withCoordinates:
  ///   Include location data in the response
  ///
  /// * [bool] withPartners:
  ///   Include assets shared by partners
  ///
  /// * [bool] withStacked:
  ///   Include stacked assets in the response. When true, only primary assets from stacks are returned.
  Future<Response> getTimeBucketWithHttpInfo(String timeBucket, { String? albumId, bool? isFavorite, bool? isTrashed, String? key, AssetOrder? order, String? personId, String? slug, String? tagId, String? userId, AssetVisibility? visibility, bool? withCoordinates, bool? withPartners, bool? withStacked, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/timeline/bucket';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (albumId != null) {
      queryParams.addAll(_queryParams('', 'albumId', albumId));
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
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// This endpoint requires the `asset.read` permission.
  ///
  /// Parameters:
  ///
  /// * [String] timeBucket (required):
  ///   Time bucket identifier in YYYY-MM-DD format (e.g., \"2024-01-01\" for January 2024)
  ///
  /// * [String] albumId:
  ///   Filter assets belonging to a specific album
  ///
  /// * [bool] isFavorite:
  ///   Filter by favorite status (true for favorites only, false for non-favorites only)
  ///
  /// * [bool] isTrashed:
  ///   Filter by trash status (true for trashed assets only, false for non-trashed only)
  ///
  /// * [String] key:
  ///
  /// * [AssetOrder] order:
  ///   Sort order for assets within time buckets (ASC for oldest first, DESC for newest first)
  ///
  /// * [String] personId:
  ///   Filter assets containing a specific person (face recognition)
  ///
  /// * [String] slug:
  ///
  /// * [String] tagId:
  ///   Filter assets with a specific tag
  ///
  /// * [String] userId:
  ///   Filter assets by specific user ID
  ///
  /// * [AssetVisibility] visibility:
  ///   Filter by asset visibility status (ARCHIVE, TIMELINE, HIDDEN, LOCKED)
  ///
  /// * [bool] withCoordinates:
  ///   Include location data in the response
  ///
  /// * [bool] withPartners:
  ///   Include assets shared by partners
  ///
  /// * [bool] withStacked:
  ///   Include stacked assets in the response. When true, only primary assets from stacks are returned.
  Future<TimeBucketAssetResponseDto?> getTimeBucket(String timeBucket, { String? albumId, bool? isFavorite, bool? isTrashed, String? key, AssetOrder? order, String? personId, String? slug, String? tagId, String? userId, AssetVisibility? visibility, bool? withCoordinates, bool? withPartners, bool? withStacked, }) async {
    final response = await getTimeBucketWithHttpInfo(timeBucket,  albumId: albumId, isFavorite: isFavorite, isTrashed: isTrashed, key: key, order: order, personId: personId, slug: slug, tagId: tagId, userId: userId, visibility: visibility, withCoordinates: withCoordinates, withPartners: withPartners, withStacked: withStacked, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'TimeBucketAssetResponseDto',) as TimeBucketAssetResponseDto;
    
    }
    return null;
  }

  /// This endpoint requires the `asset.read` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] albumId:
  ///   Filter assets belonging to a specific album
  ///
  /// * [bool] isFavorite:
  ///   Filter by favorite status (true for favorites only, false for non-favorites only)
  ///
  /// * [bool] isTrashed:
  ///   Filter by trash status (true for trashed assets only, false for non-trashed only)
  ///
  /// * [String] key:
  ///
  /// * [AssetOrder] order:
  ///   Sort order for assets within time buckets (ASC for oldest first, DESC for newest first)
  ///
  /// * [String] personId:
  ///   Filter assets containing a specific person (face recognition)
  ///
  /// * [String] slug:
  ///
  /// * [String] tagId:
  ///   Filter assets with a specific tag
  ///
  /// * [String] userId:
  ///   Filter assets by specific user ID
  ///
  /// * [AssetVisibility] visibility:
  ///   Filter by asset visibility status (ARCHIVE, TIMELINE, HIDDEN, LOCKED)
  ///
  /// * [bool] withCoordinates:
  ///   Include location data in the response
  ///
  /// * [bool] withPartners:
  ///   Include assets shared by partners
  ///
  /// * [bool] withStacked:
  ///   Include stacked assets in the response. When true, only primary assets from stacks are returned.
  Future<Response> getTimeBucketsWithHttpInfo({ String? albumId, bool? isFavorite, bool? isTrashed, String? key, AssetOrder? order, String? personId, String? slug, String? tagId, String? userId, AssetVisibility? visibility, bool? withCoordinates, bool? withPartners, bool? withStacked, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/timeline/buckets';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (albumId != null) {
      queryParams.addAll(_queryParams('', 'albumId', albumId));
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
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// This endpoint requires the `asset.read` permission.
  ///
  /// Parameters:
  ///
  /// * [String] albumId:
  ///   Filter assets belonging to a specific album
  ///
  /// * [bool] isFavorite:
  ///   Filter by favorite status (true for favorites only, false for non-favorites only)
  ///
  /// * [bool] isTrashed:
  ///   Filter by trash status (true for trashed assets only, false for non-trashed only)
  ///
  /// * [String] key:
  ///
  /// * [AssetOrder] order:
  ///   Sort order for assets within time buckets (ASC for oldest first, DESC for newest first)
  ///
  /// * [String] personId:
  ///   Filter assets containing a specific person (face recognition)
  ///
  /// * [String] slug:
  ///
  /// * [String] tagId:
  ///   Filter assets with a specific tag
  ///
  /// * [String] userId:
  ///   Filter assets by specific user ID
  ///
  /// * [AssetVisibility] visibility:
  ///   Filter by asset visibility status (ARCHIVE, TIMELINE, HIDDEN, LOCKED)
  ///
  /// * [bool] withCoordinates:
  ///   Include location data in the response
  ///
  /// * [bool] withPartners:
  ///   Include assets shared by partners
  ///
  /// * [bool] withStacked:
  ///   Include stacked assets in the response. When true, only primary assets from stacks are returned.
  Future<List<TimeBucketsResponseDto>?> getTimeBuckets({ String? albumId, bool? isFavorite, bool? isTrashed, String? key, AssetOrder? order, String? personId, String? slug, String? tagId, String? userId, AssetVisibility? visibility, bool? withCoordinates, bool? withPartners, bool? withStacked, }) async {
    final response = await getTimeBucketsWithHttpInfo( albumId: albumId, isFavorite: isFavorite, isTrashed: isTrashed, key: key, order: order, personId: personId, slug: slug, tagId: tagId, userId: userId, visibility: visibility, withCoordinates: withCoordinates, withPartners: withPartners, withStacked: withStacked, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<TimeBucketsResponseDto>') as List)
        .cast<TimeBucketsResponseDto>()
        .toList(growable: false);

    }
    return null;
  }
}
