//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AuthenticationApi {
  AuthenticationApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'POST /auth/change-password' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [ChangePasswordDto] changePasswordDto (required):
  Future<Response> changePasswordWithHttpInfo(ChangePasswordDto changePasswordDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/auth/change-password';

    // ignore: prefer_final_locals
    Object? postBody = changePasswordDto;

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

  /// Parameters:
  ///
  /// * [ChangePasswordDto] changePasswordDto (required):
  Future<UserAdminResponseDto?> changePassword(ChangePasswordDto changePasswordDto,) async {
    final response = await changePasswordWithHttpInfo(changePasswordDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UserAdminResponseDto',) as UserAdminResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'PUT /auth/pin-code' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [PinCodeChangeDto] pinCodeChangeDto (required):
  Future<Response> changePinCodeWithHttpInfo(PinCodeChangeDto pinCodeChangeDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/auth/pin-code';

    // ignore: prefer_final_locals
    Object? postBody = pinCodeChangeDto;

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

  /// Parameters:
  ///
  /// * [PinCodeChangeDto] pinCodeChangeDto (required):
  Future<void> changePinCode(PinCodeChangeDto pinCodeChangeDto,) async {
    final response = await changePinCodeWithHttpInfo(pinCodeChangeDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'GET /auth/status' operation and returns the [Response].
  Future<Response> getAuthStatusWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/auth/status';

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

  Future<AuthStatusResponseDto?> getAuthStatus() async {
    final response = await getAuthStatusWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AuthStatusResponseDto',) as AuthStatusResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /auth/session/lock' operation and returns the [Response].
  Future<Response> lockAuthSessionWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/auth/session/lock';

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

  Future<void> lockAuthSession() async {
    final response = await lockAuthSessionWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'POST /auth/login' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [LoginCredentialDto] loginCredentialDto (required):
  Future<Response> loginWithHttpInfo(LoginCredentialDto loginCredentialDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/auth/login';

    // ignore: prefer_final_locals
    Object? postBody = loginCredentialDto;

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

  /// Parameters:
  ///
  /// * [LoginCredentialDto] loginCredentialDto (required):
  Future<LoginResponseDto?> login(LoginCredentialDto loginCredentialDto,) async {
    final response = await loginWithHttpInfo(loginCredentialDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'LoginResponseDto',) as LoginResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /auth/logout' operation and returns the [Response].
  Future<Response> logoutWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/auth/logout';

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

  Future<LogoutResponseDto?> logout() async {
    final response = await logoutWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'LogoutResponseDto',) as LogoutResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'DELETE /auth/pin-code' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [PinCodeResetDto] pinCodeResetDto (required):
  Future<Response> resetPinCodeWithHttpInfo(PinCodeResetDto pinCodeResetDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/auth/pin-code';

    // ignore: prefer_final_locals
    Object? postBody = pinCodeResetDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


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

  /// Parameters:
  ///
  /// * [PinCodeResetDto] pinCodeResetDto (required):
  Future<void> resetPinCode(PinCodeResetDto pinCodeResetDto,) async {
    final response = await resetPinCodeWithHttpInfo(pinCodeResetDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'POST /auth/pin-code' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [PinCodeSetupDto] pinCodeSetupDto (required):
  Future<Response> setupPinCodeWithHttpInfo(PinCodeSetupDto pinCodeSetupDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/auth/pin-code';

    // ignore: prefer_final_locals
    Object? postBody = pinCodeSetupDto;

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

  /// Parameters:
  ///
  /// * [PinCodeSetupDto] pinCodeSetupDto (required):
  Future<void> setupPinCode(PinCodeSetupDto pinCodeSetupDto,) async {
    final response = await setupPinCodeWithHttpInfo(pinCodeSetupDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'POST /auth/admin-sign-up' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [SignUpDto] signUpDto (required):
  Future<Response> signUpAdminWithHttpInfo(SignUpDto signUpDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/auth/admin-sign-up';

    // ignore: prefer_final_locals
    Object? postBody = signUpDto;

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

  /// Parameters:
  ///
  /// * [SignUpDto] signUpDto (required):
  Future<UserAdminResponseDto?> signUpAdmin(SignUpDto signUpDto,) async {
    final response = await signUpAdminWithHttpInfo(signUpDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UserAdminResponseDto',) as UserAdminResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /auth/session/unlock' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [SessionUnlockDto] sessionUnlockDto (required):
  Future<Response> unlockAuthSessionWithHttpInfo(SessionUnlockDto sessionUnlockDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/auth/session/unlock';

    // ignore: prefer_final_locals
    Object? postBody = sessionUnlockDto;

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

  /// Parameters:
  ///
  /// * [SessionUnlockDto] sessionUnlockDto (required):
  Future<void> unlockAuthSession(SessionUnlockDto sessionUnlockDto,) async {
    final response = await unlockAuthSessionWithHttpInfo(sessionUnlockDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'POST /auth/validateToken' operation and returns the [Response].
  Future<Response> validateAccessTokenWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/auth/validateToken';

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

  Future<ValidateAccessTokenResponseDto?> validateAccessToken() async {
    final response = await validateAccessTokenWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ValidateAccessTokenResponseDto',) as ValidateAccessTokenResponseDto;
    
    }
    return null;
  }
}
