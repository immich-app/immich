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

  /// Performs an HTTP 'GET /map/markers' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [DateTime] fileCreatedAfter:
  ///
  /// * [DateTime] fileCreatedBefore:
  ///
  /// * [bool] isArchived:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] withPartners:
  ///
  /// * [bool] withSharedAlbums:
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

  /// Parameters:
  ///
  /// * [DateTime] fileCreatedAfter:
  ///
  /// * [DateTime] fileCreatedBefore:
  ///
  /// * [bool] isArchived:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] withPartners:
  ///
  /// * [bool] withSharedAlbums:
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

  /// Performs an HTTP 'GET /map/reverse-geocode' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [double] lat (required):
  ///
  /// * [double] lon (required):
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

  /// Parameters:
  ///
  /// * [double] lat (required):
  ///
  /// * [double] lon (required):
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
}
