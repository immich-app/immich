//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class GalleryMapApi {
  GalleryMapApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Get filtered map markers
  ///
  /// Retrieve map markers with rich content filtering (people, camera, tags, etc.)
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [bool] isFavorite:
  ///   Filter by favorite status
  ///
  /// * [String] make:
  ///   Camera make
  ///
  /// * [String] model:
  ///   Camera model
  ///
  /// * [List<String>] personIds:
  ///   Filter by person IDs
  ///
  /// * [num] rating:
  ///   Minimum star rating
  ///
  /// * [String] spaceId:
  ///   Scope to a shared space
  ///
  /// * [List<String>] tagIds:
  ///   Filter by tag IDs
  ///
  /// * [DateTime] takenAfter:
  ///   Filter assets taken after this date
  ///
  /// * [DateTime] takenBefore:
  ///   Filter assets taken before this date
  ///
  /// * [String] type:
  ///   Filter by media type
  Future<Response> getFilteredMapMarkersWithHttpInfo({ bool? isFavorite, String? make, String? model, List<String>? personIds, num? rating, String? spaceId, List<String>? tagIds, DateTime? takenAfter, DateTime? takenBefore, String? type, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/gallery/map/markers';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (isFavorite != null) {
      queryParams.addAll(_queryParams('', 'isFavorite', isFavorite));
    }
    if (make != null) {
      queryParams.addAll(_queryParams('', 'make', make));
    }
    if (model != null) {
      queryParams.addAll(_queryParams('', 'model', model));
    }
    if (personIds != null) {
      queryParams.addAll(_queryParams('multi', 'personIds', personIds));
    }
    if (rating != null) {
      queryParams.addAll(_queryParams('', 'rating', rating));
    }
    if (spaceId != null) {
      queryParams.addAll(_queryParams('', 'spaceId', spaceId));
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

  /// Get filtered map markers
  ///
  /// Retrieve map markers with rich content filtering (people, camera, tags, etc.)
  ///
  /// Parameters:
  ///
  /// * [bool] isFavorite:
  ///   Filter by favorite status
  ///
  /// * [String] make:
  ///   Camera make
  ///
  /// * [String] model:
  ///   Camera model
  ///
  /// * [List<String>] personIds:
  ///   Filter by person IDs
  ///
  /// * [num] rating:
  ///   Minimum star rating
  ///
  /// * [String] spaceId:
  ///   Scope to a shared space
  ///
  /// * [List<String>] tagIds:
  ///   Filter by tag IDs
  ///
  /// * [DateTime] takenAfter:
  ///   Filter assets taken after this date
  ///
  /// * [DateTime] takenBefore:
  ///   Filter assets taken before this date
  ///
  /// * [String] type:
  ///   Filter by media type
  Future<List<MapMarkerResponseDto>?> getFilteredMapMarkers({ bool? isFavorite, String? make, String? model, List<String>? personIds, num? rating, String? spaceId, List<String>? tagIds, DateTime? takenAfter, DateTime? takenBefore, String? type, }) async {
    final response = await getFilteredMapMarkersWithHttpInfo( isFavorite: isFavorite, make: make, model: model, personIds: personIds, rating: rating, spaceId: spaceId, tagIds: tagIds, takenAfter: takenAfter, takenBefore: takenBefore, type: type, );
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
}
