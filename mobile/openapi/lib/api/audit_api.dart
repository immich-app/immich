//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AuditApi {
  AuditApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'GET /audit/deletes' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [DateTime] after (required):
  ///
  /// * [EntityType] entityType (required):
  ///
  /// * [String] userId:
  Future<Response> getAuditDeletesWithHttpInfo(DateTime after, EntityType entityType, { String? userId, }) async {
    // ignore: prefer_const_declarations
    final path = r'/audit/deletes';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'after', after));
      queryParams.addAll(_queryParams('', 'entityType', entityType));
    if (userId != null) {
      queryParams.addAll(_queryParams('', 'userId', userId));
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
  /// * [DateTime] after (required):
  ///
  /// * [EntityType] entityType (required):
  ///
  /// * [String] userId:
  Future<AuditDeletesResponseDto?> getAuditDeletes(DateTime after, EntityType entityType, { String? userId, }) async {
    final response = await getAuditDeletesWithHttpInfo(after, entityType,  userId: userId, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AuditDeletesResponseDto',) as AuditDeletesResponseDto;
    
    }
    return null;
  }
}
