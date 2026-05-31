// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class AuthenticationApi {
  AuthenticationApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion signUpAdminAddedIn = .new(1, 0, 0);

  static const ApiState signUpAdminState = .stable;

  static const ApiVersion changePasswordAddedIn = .new(1, 0, 0);

  static const ApiState changePasswordState = .stable;

  static const ApiVersion loginAddedIn = .new(1, 0, 0);

  static const ApiState loginState = .stable;

  static const ApiVersion logoutAddedIn = .new(1, 0, 0);

  static const ApiState logoutState = .stable;

  static const ApiVersion resetPinCodeAddedIn = .new(1, 0, 0);

  static const ApiState resetPinCodeState = .stable;

  static const ApiVersion setupPinCodeAddedIn = .new(1, 0, 0);

  static const ApiState setupPinCodeState = .stable;

  static const ApiVersion changePinCodeAddedIn = .new(1, 0, 0);

  static const ApiState changePinCodeState = .stable;

  static const ApiVersion lockAuthSessionAddedIn = .new(1, 0, 0);

  static const ApiState lockAuthSessionState = .stable;

  static const ApiVersion unlockAuthSessionAddedIn = .new(1, 0, 0);

  static const ApiState unlockAuthSessionState = .stable;

  static const ApiVersion getAuthStatusAddedIn = .new(1, 0, 0);

  static const ApiState getAuthStatusState = .stable;

  static const ApiVersion validateAccessTokenAddedIn = .new(1, 0, 0);

  static const ApiState validateAccessTokenState = .stable;

  static const ApiVersion startOAuthAddedIn = .new(1, 0, 0);

  static const ApiState startOAuthState = .stable;

  static const ApiVersion logoutOAuthAddedIn = .new(2, 0, 0);

  static const ApiState logoutOAuthState = .added;

  static const ApiVersion finishOAuthAddedIn = .new(1, 0, 0);

  static const ApiState finishOAuthState = .stable;

  static const ApiVersion linkOAuthAccountAddedIn = .new(1, 0, 0);

  static const ApiState linkOAuthAccountState = .stable;

  static const ApiVersion redirectOAuthToMobileAddedIn = .new(1, 0, 0);

  static const ApiState redirectOAuthToMobileState = .stable;

  static const ApiVersion unlinkOAuthAccountAddedIn = .new(1, 0, 0);

  static const ApiState unlinkOAuthAccountState = .stable;

  /// Register admin
  ///
  /// Create the first admin user in the system.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> signUpAdminWithHttpInfo(SignUpDto signUpDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/auth/admin-sign-up';

    Object? postBody = signUpDto;

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

  /// Register admin
  ///
  /// Create the first admin user in the system.
  ///
  /// Available since server v1.0.0.
  Future<UserAdminResponseDto> signUpAdmin(SignUpDto signUpDto, {Future<void>? abortTrigger}) async {
    final response = await signUpAdminWithHttpInfo(signUpDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'UserAdminResponseDto')
          as UserAdminResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Change password
  ///
  /// Change the password of the current user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> changePasswordWithHttpInfo(ChangePasswordDto changePasswordDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/auth/change-password';

    Object? postBody = changePasswordDto;

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

  /// Change password
  ///
  /// Change the password of the current user.
  ///
  /// Available since server v1.0.0.
  Future<UserAdminResponseDto> changePassword(ChangePasswordDto changePasswordDto, {Future<void>? abortTrigger}) async {
    final response = await changePasswordWithHttpInfo(changePasswordDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'UserAdminResponseDto')
          as UserAdminResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Login
  ///
  /// Login with username and password and receive a session token.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> loginWithHttpInfo(LoginCredentialDto loginCredentialDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/auth/login';

    Object? postBody = loginCredentialDto;

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

  /// Login
  ///
  /// Login with username and password and receive a session token.
  ///
  /// Available since server v1.0.0.
  Future<LoginResponseDto> login(LoginCredentialDto loginCredentialDto, {Future<void>? abortTrigger}) async {
    final response = await loginWithHttpInfo(loginCredentialDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'LoginResponseDto')
          as LoginResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Logout
  ///
  /// Logout the current user and invalidate the session token.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> logoutWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/auth/logout';

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

  /// Logout
  ///
  /// Logout the current user and invalidate the session token.
  ///
  /// Available since server v1.0.0.
  Future<LogoutResponseDto> logout({Future<void>? abortTrigger}) async {
    final response = await logoutWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'LogoutResponseDto')
          as LogoutResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Reset pin code
  ///
  /// Reset the pin code for the current user by providing the account password
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> resetPinCodeWithHttpInfo(PinCodeResetDto pinCodeResetDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/auth/pin-code';

    Object? postBody = pinCodeResetDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

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

  /// Reset pin code
  ///
  /// Reset the pin code for the current user by providing the account password
  ///
  /// Available since server v1.0.0.
  Future<void> resetPinCode(PinCodeResetDto pinCodeResetDto, {Future<void>? abortTrigger}) async {
    final response = await resetPinCodeWithHttpInfo(pinCodeResetDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Setup pin code
  ///
  /// Setup a new pin code for the current user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> setupPinCodeWithHttpInfo(PinCodeSetupDto pinCodeSetupDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/auth/pin-code';

    Object? postBody = pinCodeSetupDto;

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

  /// Setup pin code
  ///
  /// Setup a new pin code for the current user.
  ///
  /// Available since server v1.0.0.
  Future<void> setupPinCode(PinCodeSetupDto pinCodeSetupDto, {Future<void>? abortTrigger}) async {
    final response = await setupPinCodeWithHttpInfo(pinCodeSetupDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Change pin code
  ///
  /// Change the pin code for the current user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> changePinCodeWithHttpInfo(PinCodeChangeDto pinCodeChangeDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/auth/pin-code';

    Object? postBody = pinCodeChangeDto;

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

  /// Change pin code
  ///
  /// Change the pin code for the current user.
  ///
  /// Available since server v1.0.0.
  Future<void> changePinCode(PinCodeChangeDto pinCodeChangeDto, {Future<void>? abortTrigger}) async {
    final response = await changePinCodeWithHttpInfo(pinCodeChangeDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Lock auth session
  ///
  /// Remove elevated access to locked assets from the current session.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> lockAuthSessionWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/auth/session/lock';

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

  /// Lock auth session
  ///
  /// Remove elevated access to locked assets from the current session.
  ///
  /// Available since server v1.0.0.
  Future<void> lockAuthSession({Future<void>? abortTrigger}) async {
    final response = await lockAuthSessionWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Unlock auth session
  ///
  /// Temporarily grant the session elevated access to locked assets by providing the correct PIN code.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> unlockAuthSessionWithHttpInfo(
    SessionUnlockDto sessionUnlockDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/auth/session/unlock';

    Object? postBody = sessionUnlockDto;

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

  /// Unlock auth session
  ///
  /// Temporarily grant the session elevated access to locked assets by providing the correct PIN code.
  ///
  /// Available since server v1.0.0.
  Future<void> unlockAuthSession(SessionUnlockDto sessionUnlockDto, {Future<void>? abortTrigger}) async {
    final response = await unlockAuthSessionWithHttpInfo(sessionUnlockDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve auth status
  ///
  /// Get information about the current session, including whether the user has a password, and if the session can access locked assets.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAuthStatusWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/auth/status';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

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

  /// Retrieve auth status
  ///
  /// Get information about the current session, including whether the user has a password, and if the session can access locked assets.
  ///
  /// Available since server v1.0.0.
  Future<AuthStatusResponseDto> getAuthStatus({Future<void>? abortTrigger}) async {
    final response = await getAuthStatusWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'AuthStatusResponseDto')
          as AuthStatusResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Validate access token
  ///
  /// Validate the current authorization method is still valid.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> validateAccessTokenWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/auth/validateToken';

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

  /// Validate access token
  ///
  /// Validate the current authorization method is still valid.
  ///
  /// Available since server v1.0.0.
  Future<ValidateAccessTokenResponseDto> validateAccessToken({Future<void>? abortTrigger}) async {
    final response = await validateAccessTokenWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'ValidateAccessTokenResponseDto')
          as ValidateAccessTokenResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Start OAuth
  ///
  /// Initiate the OAuth authorization process.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> startOAuthWithHttpInfo(OAuthConfigDto oAuthConfigDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/oauth/authorize';

    Object? postBody = oAuthConfigDto;

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

  /// Start OAuth
  ///
  /// Initiate the OAuth authorization process.
  ///
  /// Available since server v1.0.0.
  Future<OAuthAuthorizeResponseDto> startOAuth(OAuthConfigDto oAuthConfigDto, {Future<void>? abortTrigger}) async {
    final response = await startOAuthWithHttpInfo(oAuthConfigDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'OAuthAuthorizeResponseDto')
          as OAuthAuthorizeResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Backchannel OAuth logout
  ///
  /// Logout the OAuth account and invalidate the session specified by the sid claim or all sessions if the sid claim is not present.
  ///
  /// Available since server v2.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> logoutOAuthWithHttpInfo(
    OAuthBackchannelLogoutDto oAuthBackchannelLogoutDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/oauth/backchannel-logout';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/x-www-form-urlencoded'];

    oAuthBackchannelLogoutDto.toJson().forEach((k, v) {
      if (v != null) {
        formParams[k] = parameterToString(v);
      }
    });
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

  /// Backchannel OAuth logout
  ///
  /// Logout the OAuth account and invalidate the session specified by the sid claim or all sessions if the sid claim is not present.
  ///
  /// Available since server v2.0.0.
  Future<void> logoutOAuth(OAuthBackchannelLogoutDto oAuthBackchannelLogoutDto, {Future<void>? abortTrigger}) async {
    final response = await logoutOAuthWithHttpInfo(oAuthBackchannelLogoutDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Finish OAuth
  ///
  /// Complete the OAuth authorization process by exchanging the authorization code for a session token.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> finishOAuthWithHttpInfo(OAuthCallbackDto oAuthCallbackDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/oauth/callback';

    Object? postBody = oAuthCallbackDto;

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

  /// Finish OAuth
  ///
  /// Complete the OAuth authorization process by exchanging the authorization code for a session token.
  ///
  /// Available since server v1.0.0.
  Future<LoginResponseDto> finishOAuth(OAuthCallbackDto oAuthCallbackDto, {Future<void>? abortTrigger}) async {
    final response = await finishOAuthWithHttpInfo(oAuthCallbackDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'LoginResponseDto')
          as LoginResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Link OAuth account
  ///
  /// Link an OAuth account to the authenticated user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> linkOAuthAccountWithHttpInfo(OAuthCallbackDto oAuthCallbackDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/oauth/link';

    Object? postBody = oAuthCallbackDto;

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

  /// Link OAuth account
  ///
  /// Link an OAuth account to the authenticated user.
  ///
  /// Available since server v1.0.0.
  Future<UserAdminResponseDto> linkOAuthAccount(OAuthCallbackDto oAuthCallbackDto, {Future<void>? abortTrigger}) async {
    final response = await linkOAuthAccountWithHttpInfo(oAuthCallbackDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'UserAdminResponseDto')
          as UserAdminResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Redirect OAuth to mobile
  ///
  /// Requests to this URL are automatically forwarded to the mobile app, and is used in some cases for OAuth redirecting.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> redirectOAuthToMobileWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/oauth/mobile-redirect';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

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

  /// Redirect OAuth to mobile
  ///
  /// Requests to this URL are automatically forwarded to the mobile app, and is used in some cases for OAuth redirecting.
  ///
  /// Available since server v1.0.0.
  Future<void> redirectOAuthToMobile({Future<void>? abortTrigger}) async {
    final response = await redirectOAuthToMobileWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Unlink OAuth account
  ///
  /// Unlink the OAuth account from the authenticated user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> unlinkOAuthAccountWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/oauth/unlink';

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

  /// Unlink OAuth account
  ///
  /// Unlink the OAuth account from the authenticated user.
  ///
  /// Available since server v1.0.0.
  Future<UserAdminResponseDto> unlinkOAuthAccount({Future<void>? abortTrigger}) async {
    final response = await unlinkOAuthAccountWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'UserAdminResponseDto')
          as UserAdminResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
