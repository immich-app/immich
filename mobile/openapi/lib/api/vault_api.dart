//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class VaultApi {
  VaultApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Recover user vault
  ///
  /// Recover a user vault using the admin private key. Sets a new vault password for the user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [Object] body (required):
  Future<Response> adminRecoverVaultWithHttpInfo(Object body,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/vault/admin/recover';

    // ignore: prefer_final_locals
    Object? postBody = body;

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

  /// Recover user vault
  ///
  /// Recover a user vault using the admin private key. Sets a new vault password for the user.
  ///
  /// Parameters:
  ///
  /// * [Object] body (required):
  Future<void> adminRecoverVault(Object body,) async {
    final response = await adminRecoverVaultWithHttpInfo(body,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Change vault password
  ///
  /// Change your vault password. This will re-encrypt the vault key.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [Object] body (required):
  Future<Response> changeVaultPasswordWithHttpInfo(Object body,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/vault/change-password';

    // ignore: prefer_final_locals
    Object? postBody = body;

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

  /// Change vault password
  ///
  /// Change your vault password. This will re-encrypt the vault key.
  ///
  /// Parameters:
  ///
  /// * [Object] body (required):
  Future<void> changeVaultPassword(Object body,) async {
    final response = await changeVaultPasswordWithHttpInfo(body,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Delete admin recovery key
  ///
  /// Delete an admin recovery key. This will prevent recovery for vaults that used this key.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteAdminRecoveryKeyWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/vault/admin/recovery-key/{id}'
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

  /// Delete admin recovery key
  ///
  /// Delete an admin recovery key. This will prevent recovery for vaults that used this key.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> deleteAdminRecoveryKey(String id,) async {
    final response = await deleteAdminRecoveryKeyWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Delete vault
  ///
  /// Delete your vault. WARNING: This will make all encrypted assets inaccessible.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteVaultWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/vault';

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

  /// Delete vault
  ///
  /// Delete your vault. WARNING: This will make all encrypted assets inaccessible.
  Future<void> deleteVault() async {
    final response = await deleteVaultWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// List admin recovery keys
  ///
  /// List all registered admin recovery keys.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAdminRecoveryKeysWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/vault/admin/recovery-keys';

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

  /// List admin recovery keys
  ///
  /// List all registered admin recovery keys.
  Future<List<Object>?> getAdminRecoveryKeys() async {
    final response = await getAdminRecoveryKeysWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<Object>') as List)
        .cast<Object>()
        .toList(growable: false);

    }
    return null;
  }

  /// Check admin recovery status
  ///
  /// Check if an admin recovery key has been registered.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAdminRecoveryStatusWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/vault/admin/recovery-status';

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

  /// Check admin recovery status
  ///
  /// Check if an admin recovery key has been registered.
  Future<Object?> getAdminRecoveryStatus() async {
    final response = await getAdminRecoveryStatusWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'Object',) as Object;
    
    }
    return null;
  }

  /// Get vault status
  ///
  /// Check if you have a vault set up and if it is currently unlocked.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getVaultStatusWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/vault/status';

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

  /// Get vault status
  ///
  /// Check if you have a vault set up and if it is currently unlocked.
  Future<Object?> getVaultStatus() async {
    final response = await getVaultStatusWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'Object',) as Object;
    
    }
    return null;
  }

  /// Lock vault
  ///
  /// Lock the vault, clearing the cached key from your session.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> lockVaultWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/vault/lock';

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

  /// Lock vault
  ///
  /// Lock the vault, clearing the cached key from your session.
  Future<void> lockVault() async {
    final response = await lockVaultWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Encrypt existing assets
  ///
  /// Queue encryption for all your existing unencrypted assets. Vault must be unlocked.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> migrateAssetsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/vault/migrate';

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

  /// Encrypt existing assets
  ///
  /// Queue encryption for all your existing unencrypted assets. Vault must be unlocked.
  Future<Object?> migrateAssets() async {
    final response = await migrateAssetsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'Object',) as Object;
    
    }
    return null;
  }

  /// Register admin recovery key
  ///
  /// Register a public key for admin vault recovery. Keep the private key safe offline.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [Object] body (required):
  Future<Response> registerAdminRecoveryKeyWithHttpInfo(Object body,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/vault/admin/recovery-key';

    // ignore: prefer_final_locals
    Object? postBody = body;

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

  /// Register admin recovery key
  ///
  /// Register a public key for admin vault recovery. Keep the private key safe offline.
  ///
  /// Parameters:
  ///
  /// * [Object] body (required):
  Future<void> registerAdminRecoveryKey(Object body,) async {
    final response = await registerAdminRecoveryKeyWithHttpInfo(body,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Set up vault
  ///
  /// Create a new vault with the specified password. This enables encryption for your assets.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [Object] body (required):
  Future<Response> setupVaultWithHttpInfo(Object body,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/vault/setup';

    // ignore: prefer_final_locals
    Object? postBody = body;

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

  /// Set up vault
  ///
  /// Create a new vault with the specified password. This enables encryption for your assets.
  ///
  /// Parameters:
  ///
  /// * [Object] body (required):
  Future<void> setupVault(Object body,) async {
    final response = await setupVaultWithHttpInfo(body,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Unlock vault
  ///
  /// Unlock the vault with your password to access encrypted assets.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [Object] body (required):
  Future<Response> unlockVaultWithHttpInfo(Object body,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/vault/unlock';

    // ignore: prefer_final_locals
    Object? postBody = body;

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

  /// Unlock vault
  ///
  /// Unlock the vault with your password to access encrypted assets.
  ///
  /// Parameters:
  ///
  /// * [Object] body (required):
  Future<void> unlockVault(Object body,) async {
    final response = await unlockVaultWithHttpInfo(body,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
