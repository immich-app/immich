// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class PartnersApi {
  PartnersApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion getPartnersAddedIn = .new(1, 0, 0);

  static const ApiState getPartnersState = .stable;

  static const ApiVersion createPartnerAddedIn = .new(1, 0, 0);

  static const ApiState createPartnerState = .stable;

  static const ApiVersion removePartnerAddedIn = .new(1, 0, 0);

  static const ApiState removePartnerState = .stable;

  static const ApiVersion createPartnerDeprecatedAddedIn = .new(1, 0, 0);

  static const ApiVersion createPartnerDeprecatedDeprecatedIn = .new(1, 0, 0);

  static const ApiState createPartnerDeprecatedState = .deprecated;

  static const ApiVersion updatePartnerAddedIn = .new(1, 0, 0);

  static const ApiState updatePartnerState = .stable;

  /// Retrieve partners
  ///
  /// Retrieve a list of partners with whom assets are shared.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getPartnersWithHttpInfo({required PartnerDirection direction, Future<void>? abortTrigger}) async {
    final apiPath = r'/partners';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    queryParams.addAll(_queryParams('', 'direction', direction));

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

  /// Retrieve partners
  ///
  /// Retrieve a list of partners with whom assets are shared.
  ///
  /// Available since server v1.0.0.
  Future<List<PartnerResponseDto>> getPartners({
    required PartnerDirection direction,
    Future<void>? abortTrigger,
  }) async {
    final response = await getPartnersWithHttpInfo(direction: direction, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<PartnerResponseDto>') as List)
          .cast<PartnerResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Create a partner
  ///
  /// Create a new partner to share assets with.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> createPartnerWithHttpInfo(PartnerCreateDto partnerCreateDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/partners';

    Object? postBody = partnerCreateDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

    return apiClient.invokeAPI(
      apiPath,
      r'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Create a partner
  ///
  /// Create a new partner to share assets with.
  ///
  /// Available since server v1.0.0.
  Future<PartnerResponseDto> createPartner(PartnerCreateDto partnerCreateDto, {Future<void>? abortTrigger}) async {
    final response = await createPartnerWithHttpInfo(partnerCreateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'PartnerResponseDto')
          as PartnerResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Remove a partner
  ///
  /// Stop sharing assets with a partner.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> removePartnerWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/partners/{id}'.replaceAll('{id}', id);

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Remove a partner
  ///
  /// Stop sharing assets with a partner.
  ///
  /// Available since server v1.0.0.
  Future<void> removePartner(String id, {Future<void>? abortTrigger}) async {
    final response = await removePartnerWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Create a partner
  ///
  /// Create a new partner to share assets with.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  @Deprecated('Deprecated by the Immich server API since v1.0.0.')
  Future<Response> createPartnerDeprecatedWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/partners/{id}'.replaceAll('{id}', id);

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Create a partner
  ///
  /// Create a new partner to share assets with.
  ///
  /// Available since server v1.0.0.
  @Deprecated('Deprecated by the Immich server API since v1.0.0.')
  Future<PartnerResponseDto> createPartnerDeprecated(String id, {Future<void>? abortTrigger}) async {
    final response = await createPartnerDeprecatedWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'PartnerResponseDto')
          as PartnerResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update a partner
  ///
  /// Specify whether a partner's assets should appear in the user's timeline.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updatePartnerWithHttpInfo(
    String id,
    PartnerUpdateDto partnerUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/partners/{id}'.replaceAll('{id}', id);

    Object? postBody = partnerUpdateDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

    return apiClient.invokeAPI(
      apiPath,
      r'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Update a partner
  ///
  /// Specify whether a partner's assets should appear in the user's timeline.
  ///
  /// Available since server v1.0.0.
  Future<PartnerResponseDto> updatePartner(
    String id,
    PartnerUpdateDto partnerUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await updatePartnerWithHttpInfo(id, partnerUpdateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'PartnerResponseDto')
          as PartnerResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
