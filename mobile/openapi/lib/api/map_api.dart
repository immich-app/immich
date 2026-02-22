//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class MapApi {
  MapApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Create favorite location
  ///
  /// Create a new favorite location for the user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [CreateFavoriteLocationDto] createFavoriteLocationDto (required):
  Future<Response> createFavoriteLocationWithHttpInfo(CreateFavoriteLocationDto createFavoriteLocationDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/map/favorite-locations';

    // ignore: prefer_final_locals
    Object? postBody = createFavoriteLocationDto;

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

  /// Create favorite location
  ///
  /// Create a new favorite location for the user.
  ///
  /// Parameters:
  ///
  /// * [CreateFavoriteLocationDto] createFavoriteLocationDto (required):
  Future<FavoriteLocationResponseDto?> createFavoriteLocation(CreateFavoriteLocationDto createFavoriteLocationDto,) async {
    final response = await createFavoriteLocationWithHttpInfo(createFavoriteLocationDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'FavoriteLocationResponseDto',) as FavoriteLocationResponseDto;
    
    }
    return null;
  }

  /// Delete favorite location
  ///
  /// Delete a favorite location by its ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteFavoriteLocationWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/map/favorite-locations/{id}'
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

  /// Delete favorite location
  ///
  /// Delete a favorite location by its ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> deleteFavoriteLocation(String id,) async {
    final response = await deleteFavoriteLocationWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Get favorite locations
  ///
  /// Retrieve a list of user's favorite locations.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getFavoriteLocationsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/map/favorite-locations';

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

  /// Get favorite locations
  ///
  /// Retrieve a list of user's favorite locations.
  Future<List<FavoriteLocationResponseDto>?> getFavoriteLocations() async {
    final response = await getFavoriteLocationsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<FavoriteLocationResponseDto>') as List)
        .cast<FavoriteLocationResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Retrieve map markers
  ///
  /// Retrieve a list of latitude and longitude coordinates for every asset with location data.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [DateTime] fileCreatedAfter:
  ///   Filter assets created after this date
  ///
  /// * [DateTime] fileCreatedBefore:
  ///   Filter assets created before this date
  ///
  /// * [bool] isArchived:
  ///   Filter by archived status
  ///
  /// * [bool] isFavorite:
  ///   Filter by favorite status
  ///
  /// * [bool] withPartners:
  ///   Include partner assets
  ///
  /// * [bool] withSharedAlbums:
  ///   Include shared album assets
  Future<Response> getMapMarkersWithHttpInfo({ DateTime? fileCreatedAfter, DateTime? fileCreatedBefore, bool? isArchived, bool? isFavorite, bool? withPartners, bool? withSharedAlbums, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/map/markers';

    // ignore: prefer_final_locals
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
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Retrieve map markers
  ///
  /// Retrieve a list of latitude and longitude coordinates for every asset with location data.
  ///
  /// Parameters:
  ///
  /// * [DateTime] fileCreatedAfter:
  ///   Filter assets created after this date
  ///
  /// * [DateTime] fileCreatedBefore:
  ///   Filter assets created before this date
  ///
  /// * [bool] isArchived:
  ///   Filter by archived status
  ///
  /// * [bool] isFavorite:
  ///   Filter by favorite status
  ///
  /// * [bool] withPartners:
  ///   Include partner assets
  ///
  /// * [bool] withSharedAlbums:
  ///   Include shared album assets
  Future<List<MapMarkerResponseDto>?> getMapMarkers({ DateTime? fileCreatedAfter, DateTime? fileCreatedBefore, bool? isArchived, bool? isFavorite, bool? withPartners, bool? withSharedAlbums, }) async {
    final response = await getMapMarkersWithHttpInfo( fileCreatedAfter: fileCreatedAfter, fileCreatedBefore: fileCreatedBefore, isArchived: isArchived, isFavorite: isFavorite, withPartners: withPartners, withSharedAlbums: withSharedAlbums, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<MapMarkerResponseDto>') as List)
        .cast<MapMarkerResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Reverse geocode coordinates
  ///
  /// Retrieve location information (e.g., city, country) for given latitude and longitude coordinates.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [double] lat (required):
  ///   Latitude (-90 to 90)
  ///
  /// * [double] lon (required):
  ///   Longitude (-180 to 180)
  Future<Response> reverseGeocodeWithHttpInfo(double lat, double lon,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/map/reverse-geocode';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'lat', lat));
      queryParams.addAll(_queryParams('', 'lon', lon));

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

  /// Reverse geocode coordinates
  ///
  /// Retrieve location information (e.g., city, country) for given latitude and longitude coordinates.
  ///
  /// Parameters:
  ///
  /// * [double] lat (required):
  ///   Latitude (-90 to 90)
  ///
  /// * [double] lon (required):
  ///   Longitude (-180 to 180)
  Future<List<MapReverseGeocodeResponseDto>?> reverseGeocode(double lat, double lon,) async {
    final response = await reverseGeocodeWithHttpInfo(lat, lon,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<MapReverseGeocodeResponseDto>') as List)
        .cast<MapReverseGeocodeResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Update favorite location
  ///
  /// Update an existing favorite location.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UpdateFavoriteLocationDto] updateFavoriteLocationDto (required):
  Future<Response> updateFavoriteLocationWithHttpInfo(String id, UpdateFavoriteLocationDto updateFavoriteLocationDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/map/favorite-locations/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = updateFavoriteLocationDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      apiPath,
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Update favorite location
  ///
  /// Update an existing favorite location.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UpdateFavoriteLocationDto] updateFavoriteLocationDto (required):
  Future<FavoriteLocationResponseDto?> updateFavoriteLocation(String id, UpdateFavoriteLocationDto updateFavoriteLocationDto,) async {
    final response = await updateFavoriteLocationWithHttpInfo(id, updateFavoriteLocationDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'FavoriteLocationResponseDto',) as FavoriteLocationResponseDto;
    
    }
    return null;
  }
}
