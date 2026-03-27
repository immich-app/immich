//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ClassificationApi {
  ClassificationApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Create a classification category
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [ClassificationCategoryCreateDto] classificationCategoryCreateDto (required):
  Future<Response> createCategoryWithHttpInfo(ClassificationCategoryCreateDto classificationCategoryCreateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/classification/categories';

    // ignore: prefer_final_locals
    Object? postBody = classificationCategoryCreateDto;

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

  /// Create a classification category
  ///
  /// Parameters:
  ///
  /// * [ClassificationCategoryCreateDto] classificationCategoryCreateDto (required):
  Future<ClassificationCategoryResponseDto?> createCategory(ClassificationCategoryCreateDto classificationCategoryCreateDto,) async {
    final response = await createCategoryWithHttpInfo(classificationCategoryCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ClassificationCategoryResponseDto',) as ClassificationCategoryResponseDto;
    
    }
    return null;
  }

  /// Delete a classification category
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteCategoryWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/classification/categories/{id}'
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

  /// Delete a classification category
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> deleteCategory(String id,) async {
    final response = await deleteCategoryWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Get classification categories
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getCategoriesWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/classification/categories';

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

  /// Get classification categories
  Future<List<ClassificationCategoryResponseDto>?> getCategories() async {
    final response = await getCategoriesWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<ClassificationCategoryResponseDto>') as List)
        .cast<ClassificationCategoryResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Scan library for classification
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> scanClassificationWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/classification/categories/scan';

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

  /// Scan library for classification
  Future<void> scanClassification() async {
    final response = await scanClassificationWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Update a classification category
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [ClassificationCategoryUpdateDto] classificationCategoryUpdateDto (required):
  Future<Response> updateCategoryWithHttpInfo(String id, ClassificationCategoryUpdateDto classificationCategoryUpdateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/classification/categories/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = classificationCategoryUpdateDto;

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

  /// Update a classification category
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [ClassificationCategoryUpdateDto] classificationCategoryUpdateDto (required):
  Future<ClassificationCategoryResponseDto?> updateCategory(String id, ClassificationCategoryUpdateDto classificationCategoryUpdateDto,) async {
    final response = await updateCategoryWithHttpInfo(id, classificationCategoryUpdateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ClassificationCategoryResponseDto',) as ClassificationCategoryResponseDto;
    
    }
    return null;
  }
}
