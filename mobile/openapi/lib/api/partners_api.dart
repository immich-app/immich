//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class PartnersApi {
  PartnersApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Create a partner
  ///
  /// Create a new partner to share assets with.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [PartnerCreateDto] partnerCreateDto (required):
  Future<Response> createPartnerWithHttpInfo(PartnerCreateDto partnerCreateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/partners';

    // ignore: prefer_final_locals
    Object? postBody = partnerCreateDto;

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

  /// Create a partner
  ///
  /// Create a new partner to share assets with.
  ///
  /// Parameters:
  ///
  /// * [PartnerCreateDto] partnerCreateDto (required):
  Future<PartnerResponseDto?> createPartner(PartnerCreateDto partnerCreateDto,) async {
    final response = await createPartnerWithHttpInfo(partnerCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'PartnerResponseDto',) as PartnerResponseDto;
    
    }
    return null;
  }

  /// Create a partner
  ///
  /// Create a new partner to share assets with.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> createPartnerDeprecatedWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/partners/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


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

  /// Create a partner
  ///
  /// Create a new partner to share assets with.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<PartnerResponseDto?> createPartnerDeprecated(String id,) async {
    final response = await createPartnerDeprecatedWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'PartnerResponseDto',) as PartnerResponseDto;
    
    }
    return null;
  }

  /// Retrieve partners
  ///
  /// Retrieve a list of partners with whom assets are shared.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [PartnerDirection] direction (required):
  Future<Response> getPartnersWithHttpInfo(PartnerDirection direction,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/partners';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'direction', direction));

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

  /// Retrieve partners
  ///
  /// Retrieve a list of partners with whom assets are shared.
  ///
  /// Parameters:
  ///
  /// * [PartnerDirection] direction (required):
  Future<List<PartnerResponseDto>?> getPartners(PartnerDirection direction,) async {
    final response = await getPartnersWithHttpInfo(direction,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<PartnerResponseDto>') as List)
        .cast<PartnerResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Remove a partner
  ///
  /// Stop sharing assets with a partner.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> removePartnerWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/partners/{id}'
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

  /// Remove a partner
  ///
  /// Stop sharing assets with a partner.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> removePartner(String id,) async {
    final response = await removePartnerWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Update a partner
  ///
  /// Specify whether a partner's assets should appear in the user's timeline.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [PartnerUpdateDto] partnerUpdateDto (required):
  Future<Response> updatePartnerWithHttpInfo(String id, PartnerUpdateDto partnerUpdateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/partners/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = partnerUpdateDto;

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

  /// Update a partner
  ///
  /// Specify whether a partner's assets should appear in the user's timeline.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [PartnerUpdateDto] partnerUpdateDto (required):
  Future<PartnerResponseDto?> updatePartner(String id, PartnerUpdateDto partnerUpdateDto,) async {
    final response = await updatePartnerWithHttpInfo(id, partnerUpdateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'PartnerResponseDto',) as PartnerResponseDto;
    
    }
    return null;
  }
}
