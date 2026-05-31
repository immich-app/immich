// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class MapApi {
  MapApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion getMapMarkersAddedIn = .new(1, 0, 0);

  static const ApiState getMapMarkersState = .stable;

  static const ApiVersion reverseGeocodeAddedIn = .new(1, 0, 0);

  static const ApiState reverseGeocodeState = .stable;

  /// Retrieve map markers
  ///
  /// Retrieve a list of latitude and longitude coordinates for every asset with location data.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getMapMarkersWithHttpInfo({
    DateTime? fileCreatedAfter,
    DateTime? fileCreatedBefore,
    bool? isArchived,
    bool? isFavorite,
    bool? withPartners,
    bool? withSharedAlbums,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/map/markers';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (fileCreatedAfter != null) {
      queryParams.addAll(_queryParams('', 'fileCreatedAfter', fileCreatedAfter));
    }
    if (fileCreatedBefore != null) {
      queryParams.addAll(_queryParams('', 'fileCreatedBefore', fileCreatedBefore));
    }
    if (isArchived != null) {
      queryParams.addAll(_queryParams('', 'isArchived', isArchived));
    }
    if (isFavorite != null) {
      queryParams.addAll(_queryParams('', 'isFavorite', isFavorite));
    }
    if (withPartners != null) {
      queryParams.addAll(_queryParams('', 'withPartners', withPartners));
    }
    if (withSharedAlbums != null) {
      queryParams.addAll(_queryParams('', 'withSharedAlbums', withSharedAlbums));
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

  /// Retrieve map markers
  ///
  /// Retrieve a list of latitude and longitude coordinates for every asset with location data.
  ///
  /// Available since server v1.0.0.
  Future<List<MapMarkerResponseDto>> getMapMarkers({
    DateTime? fileCreatedAfter,
    DateTime? fileCreatedBefore,
    bool? isArchived,
    bool? isFavorite,
    bool? withPartners,
    bool? withSharedAlbums,
    Future<void>? abortTrigger,
  }) async {
    final response = await getMapMarkersWithHttpInfo(
      fileCreatedAfter: fileCreatedAfter,
      fileCreatedBefore: fileCreatedBefore,
      isArchived: isArchived,
      isFavorite: isFavorite,
      withPartners: withPartners,
      withSharedAlbums: withSharedAlbums,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<MapMarkerResponseDto>') as List)
          .cast<MapMarkerResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Reverse geocode coordinates
  ///
  /// Retrieve location information (e.g., city, country) for given latitude and longitude coordinates.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> reverseGeocodeWithHttpInfo({
    required double lat,
    required double lon,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/map/reverse-geocode';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    queryParams.addAll(_queryParams('', 'lat', lat));
    queryParams.addAll(_queryParams('', 'lon', lon));

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

  /// Reverse geocode coordinates
  ///
  /// Retrieve location information (e.g., city, country) for given latitude and longitude coordinates.
  ///
  /// Available since server v1.0.0.
  Future<List<MapReverseGeocodeResponseDto>> reverseGeocode({
    required double lat,
    required double lon,
    Future<void>? abortTrigger,
  }) async {
    final response = await reverseGeocodeWithHttpInfo(lat: lat, lon: lon, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<MapReverseGeocodeResponseDto>') as List)
          .cast<MapReverseGeocodeResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
