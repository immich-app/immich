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

  /// Change password
  ///
  /// Change the password of the current user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [ChangePasswordDto] changePasswordDto (required):
  Future<Response> changePasswordWithHttpInfo(ChangePasswordDto changePasswordDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Change password
  ///
  /// Change the password of the current user.
  ///
  /// Parameters:
  ///
  /// * [ChangePasswordDto] changePasswordDto (required):
  Future<UserAdminResponseDto?> changePassword(ChangePasswordDto changePasswordDto, { Future<void>? abortTrigger, }) async {
    final response = await changePasswordWithHttpInfo(changePasswordDto, abortTrigger: abortTrigger,);
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

  /// Change pin code
  ///
  /// Change the pin code for the current user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [PinCodeChangeDto] pinCodeChangeDto (required):
  Future<Response> changePinCodeWithHttpInfo(PinCodeChangeDto pinCodeChangeDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Change pin code
  ///
  /// Change the pin code for the current user.
  ///
  /// Parameters:
  ///
  /// * [PinCodeChangeDto] pinCodeChangeDto (required):
  Future<void> changePinCode(PinCodeChangeDto pinCodeChangeDto, { Future<void>? abortTrigger, }) async {
    final response = await changePinCodeWithHttpInfo(pinCodeChangeDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Finish OAuth
  ///
  /// Complete the OAuth authorization process by exchanging the authorization code for a session token.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [OAuthCallbackDto] oAuthCallbackDto (required):
  Future<Response> finishOAuthWithHttpInfo(OAuthCallbackDto oAuthCallbackDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/oauth/callback';

    // ignore: prefer_final_locals
    Object? postBody = oAuthCallbackDto;

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
      abortTrigger: abortTrigger,
    );
  }

  /// Finish OAuth
  ///
  /// Complete the OAuth authorization process by exchanging the authorization code for a session token.
  ///
  /// Parameters:
  ///
  /// * [OAuthCallbackDto] oAuthCallbackDto (required):
  Future<LoginResponseDto?> finishOAuth(OAuthCallbackDto oAuthCallbackDto, { Future<void>? abortTrigger, }) async {
    final response = await finishOAuthWithHttpInfo(oAuthCallbackDto, abortTrigger: abortTrigger,);
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

  /// Retrieve auth status
  ///
  /// Get information about the current session, including whether the user has a password, and if the session can access locked assets.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAuthStatusWithHttpInfo({ Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve auth status
  ///
  /// Get information about the current session, including whether the user has a password, and if the session can access locked assets.
  Future<AuthStatusResponseDto?> getAuthStatus({ Future<void>? abortTrigger, }) async {
    final response = await getAuthStatusWithHttpInfo(abortTrigger: abortTrigger,);
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

  /// Link OAuth account
  ///
  /// Link an OAuth account to the authenticated user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [OAuthCallbackDto] oAuthCallbackDto (required):
  Future<Response> linkOAuthAccountWithHttpInfo(OAuthCallbackDto oAuthCallbackDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/oauth/link';

    // ignore: prefer_final_locals
    Object? postBody = oAuthCallbackDto;

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
      abortTrigger: abortTrigger,
    );
  }

  /// Link OAuth account
  ///
  /// Link an OAuth account to the authenticated user.
  ///
  /// Parameters:
  ///
  /// * [OAuthCallbackDto] oAuthCallbackDto (required):
  Future<UserAdminResponseDto?> linkOAuthAccount(OAuthCallbackDto oAuthCallbackDto, { Future<void>? abortTrigger, }) async {
    final response = await linkOAuthAccountWithHttpInfo(oAuthCallbackDto, abortTrigger: abortTrigger,);
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

  /// Lock auth session
  ///
  /// Remove elevated access to locked assets from the current session.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> lockAuthSessionWithHttpInfo({ Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Lock auth session
  ///
  /// Remove elevated access to locked assets from the current session.
  Future<void> lockAuthSession({ Future<void>? abortTrigger, }) async {
    final response = await lockAuthSessionWithHttpInfo(abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Login
  ///
  /// Login with username and password and receive a session token.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [LoginCredentialDto] loginCredentialDto (required):
  Future<Response> loginWithHttpInfo(LoginCredentialDto loginCredentialDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Login
  ///
  /// Login with username and password and receive a session token.
  ///
  /// Parameters:
  ///
  /// * [LoginCredentialDto] loginCredentialDto (required):
  Future<LoginResponseDto?> login(LoginCredentialDto loginCredentialDto, { Future<void>? abortTrigger, }) async {
    final response = await loginWithHttpInfo(loginCredentialDto, abortTrigger: abortTrigger,);
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

  /// Logout
  ///
  /// Logout the current user and invalidate the session token.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> logoutWithHttpInfo({ Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Logout
  ///
  /// Logout the current user and invalidate the session token.
  Future<LogoutResponseDto?> logout({ Future<void>? abortTrigger, }) async {
    final response = await logoutWithHttpInfo(abortTrigger: abortTrigger,);
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

  /// Backchannel OAuth logout
  ///
  /// Logout the OAuth account and invalidate the session specified by the sid claim or all sessions if the sid claim is not present.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] logoutToken (required):
  ///   OAuth logout token
  Future<Response> logoutOAuthWithHttpInfo(String logoutToken, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/oauth/backchannel-logout';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/x-www-form-urlencoded'];

    if (logoutToken != null) {
      formParams[r'logout_token'] = parameterToString(logoutToken);
    }

    return apiClient.invokeAPI(
      apiPath,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Backchannel OAuth logout
  ///
  /// Logout the OAuth account and invalidate the session specified by the sid claim or all sessions if the sid claim is not present.
  ///
  /// Parameters:
  ///
  /// * [String] logoutToken (required):
  ///   OAuth logout token
  Future<void> logoutOAuth(String logoutToken, { Future<void>? abortTrigger, }) async {
    final response = await logoutOAuthWithHttpInfo(logoutToken, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Redirect OAuth to mobile
  ///
  /// Requests to this URL are automatically forwarded to the mobile app, and is used in some cases for OAuth redirecting.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> redirectOAuthToMobileWithHttpInfo({ Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/oauth/mobile-redirect';

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
      abortTrigger: abortTrigger,
    );
  }

  /// Redirect OAuth to mobile
  ///
  /// Requests to this URL are automatically forwarded to the mobile app, and is used in some cases for OAuth redirecting.
  Future<void> redirectOAuthToMobile({ Future<void>? abortTrigger, }) async {
    final response = await redirectOAuthToMobileWithHttpInfo(abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Reset pin code
  ///
  /// Reset the pin code for the current user by providing the account password
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [PinCodeResetDto] pinCodeResetDto (required):
  Future<Response> resetPinCodeWithHttpInfo(PinCodeResetDto pinCodeResetDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Reset pin code
  ///
  /// Reset the pin code for the current user by providing the account password
  ///
  /// Parameters:
  ///
  /// * [PinCodeResetDto] pinCodeResetDto (required):
  Future<void> resetPinCode(PinCodeResetDto pinCodeResetDto, { Future<void>? abortTrigger, }) async {
    final response = await resetPinCodeWithHttpInfo(pinCodeResetDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Setup pin code
  ///
  /// Setup a new pin code for the current user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [PinCodeSetupDto] pinCodeSetupDto (required):
  Future<Response> setupPinCodeWithHttpInfo(PinCodeSetupDto pinCodeSetupDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Setup pin code
  ///
  /// Setup a new pin code for the current user.
  ///
  /// Parameters:
  ///
  /// * [PinCodeSetupDto] pinCodeSetupDto (required):
  Future<void> setupPinCode(PinCodeSetupDto pinCodeSetupDto, { Future<void>? abortTrigger, }) async {
    final response = await setupPinCodeWithHttpInfo(pinCodeSetupDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Register admin
  ///
  /// Create the first admin user in the system.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [SignUpDto] signUpDto (required):
  Future<Response> signUpAdminWithHttpInfo(SignUpDto signUpDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Register admin
  ///
  /// Create the first admin user in the system.
  ///
  /// Parameters:
  ///
  /// * [SignUpDto] signUpDto (required):
  Future<UserAdminResponseDto?> signUpAdmin(SignUpDto signUpDto, { Future<void>? abortTrigger, }) async {
    final response = await signUpAdminWithHttpInfo(signUpDto, abortTrigger: abortTrigger,);
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

  /// Start OAuth
  ///
  /// Initiate the OAuth authorization process.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [OAuthConfigDto] oAuthConfigDto (required):
  Future<Response> startOAuthWithHttpInfo(OAuthConfigDto oAuthConfigDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/oauth/authorize';

    // ignore: prefer_final_locals
    Object? postBody = oAuthConfigDto;

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
      abortTrigger: abortTrigger,
    );
  }

  /// Start OAuth
  ///
  /// Initiate the OAuth authorization process.
  ///
  /// Parameters:
  ///
  /// * [OAuthConfigDto] oAuthConfigDto (required):
  Future<OAuthAuthorizeResponseDto?> startOAuth(OAuthConfigDto oAuthConfigDto, { Future<void>? abortTrigger, }) async {
    final response = await startOAuthWithHttpInfo(oAuthConfigDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'OAuthAuthorizeResponseDto',) as OAuthAuthorizeResponseDto;
    
    }
    return null;
  }

  /// Unlink OAuth account
  ///
  /// Unlink the OAuth account from the authenticated user.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> unlinkOAuthAccountWithHttpInfo({ Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/oauth/unlink';

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
      abortTrigger: abortTrigger,
    );
  }

  /// Unlink OAuth account
  ///
  /// Unlink the OAuth account from the authenticated user.
  Future<UserAdminResponseDto?> unlinkOAuthAccount({ Future<void>? abortTrigger, }) async {
    final response = await unlinkOAuthAccountWithHttpInfo(abortTrigger: abortTrigger,);
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

  /// Unlock auth session
  ///
  /// Temporarily grant the session elevated access to locked assets by providing the correct PIN code.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [SessionUnlockDto] sessionUnlockDto (required):
  Future<Response> unlockAuthSessionWithHttpInfo(SessionUnlockDto sessionUnlockDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Unlock auth session
  ///
  /// Temporarily grant the session elevated access to locked assets by providing the correct PIN code.
  ///
  /// Parameters:
  ///
  /// * [SessionUnlockDto] sessionUnlockDto (required):
  Future<void> unlockAuthSession(SessionUnlockDto sessionUnlockDto, { Future<void>? abortTrigger, }) async {
    final response = await unlockAuthSessionWithHttpInfo(sessionUnlockDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Validate access token
  ///
  /// Validate the current authorization method is still valid.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> validateAccessTokenWithHttpInfo({ Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Validate access token
  ///
  /// Validate the current authorization method is still valid.
  Future<ValidateAccessTokenResponseDto?> validateAccessToken({ Future<void>? abortTrigger, }) async {
    final response = await validateAccessTokenWithHttpInfo(abortTrigger: abortTrigger,);
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
