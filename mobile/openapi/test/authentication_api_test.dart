//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

import 'package:openapi/api.dart';
import 'package:test/test.dart';


/// tests for AuthenticationApi
void main() {
  // final instance = AuthenticationApi();

  group('tests for AuthenticationApi', () {
    // Change password
    //
    // Change the password of the current user.
    //
    //Future<UserAdminResponseDto> changePassword(ChangePasswordDto changePasswordDto) async
    test('test changePassword', () async {
      // TODO
    });

    // Change pin code
    //
    // Change the pin code for the current user.
    //
    //Future changePinCode(PinCodeChangeDto pinCodeChangeDto) async
    test('test changePinCode', () async {
      // TODO
    });

    // Finish OAuth
    //
    // Complete the OAuth authorization process by exchanging the authorization code for a session token.
    //
    //Future<LoginResponseDto> finishOAuth(OAuthCallbackDto oAuthCallbackDto) async
    test('test finishOAuth', () async {
      // TODO
    });

    // Retrieve auth status
    //
    // Get information about the current session, including whether the user has a password, and if the session can access locked assets.
    //
    //Future<AuthStatusResponseDto> getAuthStatus() async
    test('test getAuthStatus', () async {
      // TODO
    });

    // Link OAuth account
    //
    // Link an OAuth account to the authenticated user.
    //
    //Future<UserAdminResponseDto> linkOAuthAccount(OAuthCallbackDto oAuthCallbackDto) async
    test('test linkOAuthAccount', () async {
      // TODO
    });

    // Lock auth session
    //
    // Remove elevated access to locked assets from the current session.
    //
    //Future lockAuthSession() async
    test('test lockAuthSession', () async {
      // TODO
    });

    // Login
    //
    // Login with username and password and receive a session token.
    //
    //Future<LoginResponseDto> login(LoginCredentialDto loginCredentialDto) async
    test('test login', () async {
      // TODO
    });

    // Logout
    //
    // Logout the current user and invalidate the session token.
    //
    //Future<LogoutResponseDto> logout() async
    test('test logout', () async {
      // TODO
    });

    // Backchannel OAuth logout
    //
    // Logout the OAuth account and invalidate the session specified by the sid claim or all sessions if the sid claim is not present.
    //
    //Future logoutOAuth(String logoutToken) async
    test('test logoutOAuth', () async {
      // TODO
    });

    // Redirect OAuth to mobile
    //
    // Requests to this URL are automatically forwarded to the mobile app, and is used in some cases for OAuth redirecting.
    //
    //Future redirectOAuthToMobile() async
    test('test redirectOAuthToMobile', () async {
      // TODO
    });

    // Reset pin code
    //
    // Reset the pin code for the current user by providing the account password
    //
    //Future resetPinCode(PinCodeResetDto pinCodeResetDto) async
    test('test resetPinCode', () async {
      // TODO
    });

    // Setup pin code
    //
    // Setup a new pin code for the current user.
    //
    //Future setupPinCode(PinCodeSetupDto pinCodeSetupDto) async
    test('test setupPinCode', () async {
      // TODO
    });

    // Register admin
    //
    // Create the first admin user in the system.
    //
    //Future<UserAdminResponseDto> signUpAdmin(SignUpDto signUpDto) async
    test('test signUpAdmin', () async {
      // TODO
    });

    // Start OAuth
    //
    // Initiate the OAuth authorization process.
    //
    //Future<OAuthAuthorizeResponseDto> startOAuth(OAuthConfigDto oAuthConfigDto) async
    test('test startOAuth', () async {
      // TODO
    });

    // Unlink OAuth account
    //
    // Unlink the OAuth account from the authenticated user.
    //
    //Future<UserAdminResponseDto> unlinkOAuthAccount() async
    test('test unlinkOAuthAccount', () async {
      // TODO
    });

    // Unlock auth session
    //
    // Temporarily grant the session elevated access to locked assets by providing the correct PIN code.
    //
    //Future unlockAuthSession(SessionUnlockDto sessionUnlockDto) async
    test('test unlockAuthSession', () async {
      // TODO
    });

    // Validate access token
    //
    // Validate the current authorization method is still valid.
    //
    //Future<ValidateAccessTokenResponseDto> validateAccessToken() async
    test('test validateAccessToken', () async {
      // TODO
    });

  });
}
