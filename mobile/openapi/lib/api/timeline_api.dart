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

  /// Get time bucket
  ///
  /// Retrieve a string of all asset ids in a given time bucket.
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
  /// * [String] bbox:
  ///   Bounding box coordinates as west,south,east,north (WGS84)
  ///
  /// * [String] city:
  ///   Filter by city name
  ///
  /// * [String] country:
  ///   Filter by country name
  ///
  /// * [bool] isFavorite:
  ///   Filter by favorite status (true for favorites only, false for non-favorites only)
  ///
  /// * [bool] isTrashed:
  ///   Filter by trash status (true for trashed assets only, false for non-trashed only)
  ///
  /// * [String] key:
  ///
  /// * [String] make:
  ///   Filter by camera make
  ///
  /// * [String] model:
  ///   Filter by camera model
  ///
  /// * [AssetOrder] order:
  ///   Sort order for assets within time buckets (ASC for oldest first, DESC for newest first)
  ///
  /// * [String] personId:
  ///   Filter assets containing a specific person (face recognition)
  ///
  /// * [List<String>] personIds:
  ///
  /// * [num] rating:
  ///   Minimum star rating (>=)
  ///
  /// * [String] slug:
  ///
  /// * [String] spaceId:
  ///   Filter assets belonging to a specific shared space
  ///
  /// * [String] spacePersonId:
  ///   Filter assets containing a specific shared space person (space face recognition)
  ///
  /// * [List<String>] spacePersonIds:
  ///
  /// * [String] tagId:
  ///   Filter assets with a specific tag
  ///
  /// * [List<String>] tagIds:
  ///
  /// * [String] takenAfter:
  ///   Only include assets taken on or after this date (ISO 8601)
  ///
  /// * [String] takenBefore:
  ///   Only include assets taken on or before this date (ISO 8601)
  ///
  /// * [AssetTypeEnum] type:
  ///   Filter by asset type (IMAGE or VIDEO)
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
  /// * [bool] withSharedSpaces:
  ///   Include assets from shared spaces where the user has timeline enabled
  ///
  /// * [bool] withStacked:
  ///   Include stacked assets in the response. When true, only primary assets from stacks are returned.
  Future<Response> getTimeBucketWithHttpInfo(String timeBucket, { String? albumId, String? bbox, String? city, String? country, bool? isFavorite, bool? isTrashed, String? key, String? make, String? model, AssetOrder? order, String? personId, List<String>? personIds, num? rating, String? slug, String? spaceId, String? spacePersonId, List<String>? spacePersonIds, String? tagId, List<String>? tagIds, String? takenAfter, String? takenBefore, AssetTypeEnum? type, String? userId, AssetVisibility? visibility, bool? withCoordinates, bool? withPartners, bool? withSharedSpaces, bool? withStacked, }) async {
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
    if (bbox != null) {
      queryParams.addAll(_queryParams('', 'bbox', bbox));
    }
    if (city != null) {
      queryParams.addAll(_queryParams('', 'city', city));
    }
    if (country != null) {
      queryParams.addAll(_queryParams('', 'country', country));
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
    if (make != null) {
      queryParams.addAll(_queryParams('', 'make', make));
    }
    if (model != null) {
      queryParams.addAll(_queryParams('', 'model', model));
    }
    if (order != null) {
      queryParams.addAll(_queryParams('', 'order', order));
    }
    if (personId != null) {
      queryParams.addAll(_queryParams('', 'personId', personId));
    }
    if (personIds != null) {
      queryParams.addAll(_queryParams('multi', 'personIds', personIds));
    }
    if (rating != null) {
      queryParams.addAll(_queryParams('', 'rating', rating));
    }
    if (slug != null) {
      queryParams.addAll(_queryParams('', 'slug', slug));
    }
    if (spaceId != null) {
      queryParams.addAll(_queryParams('', 'spaceId', spaceId));
    }
    if (spacePersonId != null) {
      queryParams.addAll(_queryParams('', 'spacePersonId', spacePersonId));
    }
    if (spacePersonIds != null) {
      queryParams.addAll(_queryParams('multi', 'spacePersonIds', spacePersonIds));
    }
    if (tagId != null) {
      queryParams.addAll(_queryParams('', 'tagId', tagId));
    }
    if (tagIds != null) {
      queryParams.addAll(_queryParams('multi', 'tagIds', tagIds));
    }
    if (takenAfter != null) {
      queryParams.addAll(_queryParams('', 'takenAfter', takenAfter));
    }
    if (takenBefore != null) {
      queryParams.addAll(_queryParams('', 'takenBefore', takenBefore));
    }
      queryParams.addAll(_queryParams('', 'timeBucket', timeBucket));
    if (type != null) {
      queryParams.addAll(_queryParams('', 'type', type));
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
    if (withSharedSpaces != null) {
      queryParams.addAll(_queryParams('', 'withSharedSpaces', withSharedSpaces));
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

  /// Get time bucket
  ///
  /// Retrieve a string of all asset ids in a given time bucket.
  ///
  /// Parameters:
  ///
  /// * [String] timeBucket (required):
  ///   Time bucket identifier in YYYY-MM-DD format (e.g., \"2024-01-01\" for January 2024)
  ///
  /// * [String] albumId:
  ///   Filter assets belonging to a specific album
  ///
  /// * [String] bbox:
  ///   Bounding box coordinates as west,south,east,north (WGS84)
  ///
  /// * [String] city:
  ///   Filter by city name
  ///
  /// * [String] country:
  ///   Filter by country name
  ///
  /// * [bool] isFavorite:
  ///   Filter by favorite status (true for favorites only, false for non-favorites only)
  ///
  /// * [bool] isTrashed:
  ///   Filter by trash status (true for trashed assets only, false for non-trashed only)
  ///
  /// * [String] key:
  ///
  /// * [String] make:
  ///   Filter by camera make
  ///
  /// * [String] model:
  ///   Filter by camera model
  ///
  /// * [AssetOrder] order:
  ///   Sort order for assets within time buckets (ASC for oldest first, DESC for newest first)
  ///
  /// * [String] personId:
  ///   Filter assets containing a specific person (face recognition)
  ///
  /// * [List<String>] personIds:
  ///
  /// * [num] rating:
  ///   Minimum star rating (>=)
  ///
  /// * [String] slug:
  ///
  /// * [String] spaceId:
  ///   Filter assets belonging to a specific shared space
  ///
  /// * [String] spacePersonId:
  ///   Filter assets containing a specific shared space person (space face recognition)
  ///
  /// * [List<String>] spacePersonIds:
  ///
  /// * [String] tagId:
  ///   Filter assets with a specific tag
  ///
  /// * [List<String>] tagIds:
  ///
  /// * [String] takenAfter:
  ///   Only include assets taken on or after this date (ISO 8601)
  ///
  /// * [String] takenBefore:
  ///   Only include assets taken on or before this date (ISO 8601)
  ///
  /// * [AssetTypeEnum] type:
  ///   Filter by asset type (IMAGE or VIDEO)
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
  /// * [bool] withSharedSpaces:
  ///   Include assets from shared spaces where the user has timeline enabled
  ///
  /// * [bool] withStacked:
  ///   Include stacked assets in the response. When true, only primary assets from stacks are returned.
  Future<TimeBucketAssetResponseDto?> getTimeBucket(String timeBucket, { String? albumId, String? bbox, String? city, String? country, bool? isFavorite, bool? isTrashed, String? key, String? make, String? model, AssetOrder? order, String? personId, List<String>? personIds, num? rating, String? slug, String? spaceId, String? spacePersonId, List<String>? spacePersonIds, String? tagId, List<String>? tagIds, String? takenAfter, String? takenBefore, AssetTypeEnum? type, String? userId, AssetVisibility? visibility, bool? withCoordinates, bool? withPartners, bool? withSharedSpaces, bool? withStacked, }) async {
    final response = await getTimeBucketWithHttpInfo(timeBucket,  albumId: albumId, bbox: bbox, city: city, country: country, isFavorite: isFavorite, isTrashed: isTrashed, key: key, make: make, model: model, order: order, personId: personId, personIds: personIds, rating: rating, slug: slug, spaceId: spaceId, spacePersonId: spacePersonId, spacePersonIds: spacePersonIds, tagId: tagId, tagIds: tagIds, takenAfter: takenAfter, takenBefore: takenBefore, type: type, userId: userId, visibility: visibility, withCoordinates: withCoordinates, withPartners: withPartners, withSharedSpaces: withSharedSpaces, withStacked: withStacked, );
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

  /// Get time buckets
  ///
  /// Retrieve a list of all minimal time buckets.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] albumId:
  ///   Filter assets belonging to a specific album
  ///
  /// * [String] bbox:
  ///   Bounding box coordinates as west,south,east,north (WGS84)
  ///
  /// * [String] city:
  ///   Filter by city name
  ///
  /// * [String] country:
  ///   Filter by country name
  ///
  /// * [bool] isFavorite:
  ///   Filter by favorite status (true for favorites only, false for non-favorites only)
  ///
  /// * [bool] isTrashed:
  ///   Filter by trash status (true for trashed assets only, false for non-trashed only)
  ///
  /// * [String] key:
  ///
  /// * [String] make:
  ///   Filter by camera make
  ///
  /// * [String] model:
  ///   Filter by camera model
  ///
  /// * [AssetOrder] order:
  ///   Sort order for assets within time buckets (ASC for oldest first, DESC for newest first)
  ///
  /// * [String] personId:
  ///   Filter assets containing a specific person (face recognition)
  ///
  /// * [List<String>] personIds:
  ///
  /// * [num] rating:
  ///   Minimum star rating (>=)
  ///
  /// * [String] slug:
  ///
  /// * [String] spaceId:
  ///   Filter assets belonging to a specific shared space
  ///
  /// * [String] spacePersonId:
  ///   Filter assets containing a specific shared space person (space face recognition)
  ///
  /// * [List<String>] spacePersonIds:
  ///
  /// * [String] tagId:
  ///   Filter assets with a specific tag
  ///
  /// * [List<String>] tagIds:
  ///
  /// * [String] takenAfter:
  ///   Only include assets taken on or after this date (ISO 8601)
  ///
  /// * [String] takenBefore:
  ///   Only include assets taken on or before this date (ISO 8601)
  ///
  /// * [AssetTypeEnum] type:
  ///   Filter by asset type (IMAGE or VIDEO)
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
  /// * [bool] withSharedSpaces:
  ///   Include assets from shared spaces where the user has timeline enabled
  ///
  /// * [bool] withStacked:
  ///   Include stacked assets in the response. When true, only primary assets from stacks are returned.
  Future<Response> getTimeBucketsWithHttpInfo({ String? albumId, String? bbox, String? city, String? country, bool? isFavorite, bool? isTrashed, String? key, String? make, String? model, AssetOrder? order, String? personId, List<String>? personIds, num? rating, String? slug, String? spaceId, String? spacePersonId, List<String>? spacePersonIds, String? tagId, List<String>? tagIds, String? takenAfter, String? takenBefore, AssetTypeEnum? type, String? userId, AssetVisibility? visibility, bool? withCoordinates, bool? withPartners, bool? withSharedSpaces, bool? withStacked, }) async {
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
    if (bbox != null) {
      queryParams.addAll(_queryParams('', 'bbox', bbox));
    }
    if (city != null) {
      queryParams.addAll(_queryParams('', 'city', city));
    }
    if (country != null) {
      queryParams.addAll(_queryParams('', 'country', country));
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
    if (make != null) {
      queryParams.addAll(_queryParams('', 'make', make));
    }
    if (model != null) {
      queryParams.addAll(_queryParams('', 'model', model));
    }
    if (order != null) {
      queryParams.addAll(_queryParams('', 'order', order));
    }
    if (personId != null) {
      queryParams.addAll(_queryParams('', 'personId', personId));
    }
    if (personIds != null) {
      queryParams.addAll(_queryParams('multi', 'personIds', personIds));
    }
    if (rating != null) {
      queryParams.addAll(_queryParams('', 'rating', rating));
    }
    if (slug != null) {
      queryParams.addAll(_queryParams('', 'slug', slug));
    }
    if (spaceId != null) {
      queryParams.addAll(_queryParams('', 'spaceId', spaceId));
    }
    if (spacePersonId != null) {
      queryParams.addAll(_queryParams('', 'spacePersonId', spacePersonId));
    }
    if (spacePersonIds != null) {
      queryParams.addAll(_queryParams('multi', 'spacePersonIds', spacePersonIds));
    }
    if (tagId != null) {
      queryParams.addAll(_queryParams('', 'tagId', tagId));
    }
    if (tagIds != null) {
      queryParams.addAll(_queryParams('multi', 'tagIds', tagIds));
    }
    if (takenAfter != null) {
      queryParams.addAll(_queryParams('', 'takenAfter', takenAfter));
    }
    if (takenBefore != null) {
      queryParams.addAll(_queryParams('', 'takenBefore', takenBefore));
    }
    if (type != null) {
      queryParams.addAll(_queryParams('', 'type', type));
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
    if (withSharedSpaces != null) {
      queryParams.addAll(_queryParams('', 'withSharedSpaces', withSharedSpaces));
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

  /// Get time buckets
  ///
  /// Retrieve a list of all minimal time buckets.
  ///
  /// Parameters:
  ///
  /// * [String] albumId:
  ///   Filter assets belonging to a specific album
  ///
  /// * [String] bbox:
  ///   Bounding box coordinates as west,south,east,north (WGS84)
  ///
  /// * [String] city:
  ///   Filter by city name
  ///
  /// * [String] country:
  ///   Filter by country name
  ///
  /// * [bool] isFavorite:
  ///   Filter by favorite status (true for favorites only, false for non-favorites only)
  ///
  /// * [bool] isTrashed:
  ///   Filter by trash status (true for trashed assets only, false for non-trashed only)
  ///
  /// * [String] key:
  ///
  /// * [String] make:
  ///   Filter by camera make
  ///
  /// * [String] model:
  ///   Filter by camera model
  ///
  /// * [AssetOrder] order:
  ///   Sort order for assets within time buckets (ASC for oldest first, DESC for newest first)
  ///
  /// * [String] personId:
  ///   Filter assets containing a specific person (face recognition)
  ///
  /// * [List<String>] personIds:
  ///
  /// * [num] rating:
  ///   Minimum star rating (>=)
  ///
  /// * [String] slug:
  ///
  /// * [String] spaceId:
  ///   Filter assets belonging to a specific shared space
  ///
  /// * [String] spacePersonId:
  ///   Filter assets containing a specific shared space person (space face recognition)
  ///
  /// * [List<String>] spacePersonIds:
  ///
  /// * [String] tagId:
  ///   Filter assets with a specific tag
  ///
  /// * [List<String>] tagIds:
  ///
  /// * [String] takenAfter:
  ///   Only include assets taken on or after this date (ISO 8601)
  ///
  /// * [String] takenBefore:
  ///   Only include assets taken on or before this date (ISO 8601)
  ///
  /// * [AssetTypeEnum] type:
  ///   Filter by asset type (IMAGE or VIDEO)
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
  /// * [bool] withSharedSpaces:
  ///   Include assets from shared spaces where the user has timeline enabled
  ///
  /// * [bool] withStacked:
  ///   Include stacked assets in the response. When true, only primary assets from stacks are returned.
  Future<List<TimeBucketsResponseDto>?> getTimeBuckets({ String? albumId, String? bbox, String? city, String? country, bool? isFavorite, bool? isTrashed, String? key, String? make, String? model, AssetOrder? order, String? personId, List<String>? personIds, num? rating, String? slug, String? spaceId, String? spacePersonId, List<String>? spacePersonIds, String? tagId, List<String>? tagIds, String? takenAfter, String? takenBefore, AssetTypeEnum? type, String? userId, AssetVisibility? visibility, bool? withCoordinates, bool? withPartners, bool? withSharedSpaces, bool? withStacked, }) async {
    final response = await getTimeBucketsWithHttpInfo( albumId: albumId, bbox: bbox, city: city, country: country, isFavorite: isFavorite, isTrashed: isTrashed, key: key, make: make, model: model, order: order, personId: personId, personIds: personIds, rating: rating, slug: slug, spaceId: spaceId, spacePersonId: spacePersonId, spacePersonIds: spacePersonIds, tagId: tagId, tagIds: tagIds, takenAfter: takenAfter, takenBefore: takenBefore, type: type, userId: userId, visibility: visibility, withCoordinates: withCoordinates, withPartners: withPartners, withSharedSpaces: withSharedSpaces, withStacked: withStacked, );
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
