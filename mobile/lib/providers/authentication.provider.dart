import 'package:flutter/material.dart';
import 'package:flutter_udid/flutter_udid.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/models/auth/login_response.model.dart';
import 'package:immich_mobile/models/authentication/authentication_state.model.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/auth.service.dart';
import 'package:immich_mobile/utils/hash.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class AuthenticationNotifier extends StateNotifier<AuthenticationState> {
  final AuthService _authService;
  final ApiService _apiService;
  final _log = Logger("AuthenticationNotifier");

  static const Duration _timeoutDuration = Duration(seconds: 7);

  AuthenticationNotifier(
    this._authService,
    this._apiService,
  ) : super(
          AuthenticationState(
            deviceId: "",
            userId: "",
            userEmail: "",
            name: '',
            profileImagePath: '',
            isAdmin: false,
            isAuthenticated: false,
          ),
        );

  Future<String> validateServerUrl(String url) {
    return _authService.validateServerUrl(url);
  }

  Future<LoginResponse> login(String email, String password) async {
    final response = await _authService.login(email, password);
    await setSuccessLoginInfo(accessToken: response.accessToken);
    return response;
  }

  Future<void> logout() async {
    try {
      await _authService.logout();
    } finally {
      await _cleanUp();
    }
  }

  Future<void> _cleanUp() async {
    state = AuthenticationState(
      deviceId: "",
      userId: "",
      userEmail: "",
      name: '',
      profileImagePath: '',
      isAdmin: false,
      isAuthenticated: false,
    );
  }

  void updateUserProfileImagePath(String path) {
    state = state.copyWith(profileImagePath: path);
  }

  Future<bool> changePassword(String newPassword) async {
    try {
      await _authService.changePassword(newPassword);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> setSuccessLoginInfo({
    required String accessToken,
  }) async {
    _apiService.setAccessToken(accessToken);

    // Get the deviceid from the store if it exists, otherwise generate a new one
    String deviceId =
        Store.tryGet(StoreKey.deviceId) ?? await FlutterUdid.consistentUdid;

    User? user = Store.tryGet(StoreKey.currentUser);

    UserAdminResponseDto? userResponse;
    UserPreferencesResponseDto? userPreferences;
    try {
      final responses = await Future.wait([
        _apiService.usersApi.getMyUser().timeout(_timeoutDuration),
        _apiService.usersApi.getMyPreferences().timeout(_timeoutDuration),
      ]);
      userResponse = responses[0] as UserAdminResponseDto;
      userPreferences = responses[1] as UserPreferencesResponseDto;
    } on ApiException catch (error, stackTrace) {
      if (error.code == 401) {
        _log.severe("Unauthorized access, token likely expired. Logging out.");
        return false;
      }
      _log.severe(
        "Error getting user information from the server [API EXCEPTION]",
        stackTrace,
      );
    } catch (error, stackTrace) {
      _log.severe(
        "Error getting user information from the server [CATCH ALL]",
        error,
        stackTrace,
      );
      debugPrint(
        "Error getting user information from the server [CATCH ALL] $error $stackTrace",
      );
    }

    // If the user information is successfully retrieved, update the store
    // Due to the flow of the code, this will always happen on first login
    if (userResponse != null) {
      Store.put(StoreKey.deviceId, deviceId);
      Store.put(StoreKey.deviceIdHash, fastHash(deviceId));
      Store.put(
        StoreKey.currentUser,
        User.fromUserDto(userResponse, userPreferences),
      );
      Store.put(StoreKey.accessToken, accessToken);

      user = User.fromUserDto(userResponse, userPreferences);
    } else {
      _log.severe("Unable to get user information from the server.");
    }

    // If the user is null, the login was not successful
    // and we don't have a local copy of the user from a prior successful login
    if (user == null) {
      return false;
    }

    state = state.copyWith(
      isAuthenticated: true,
      userId: user.id,
      userEmail: user.email,
      name: user.name,
      profileImagePath: user.profileImagePath,
      isAdmin: user.isAdmin,
      deviceId: deviceId,
    );

    return true;
  }
}

final authProvider =
    StateNotifierProvider<AuthenticationNotifier, AuthenticationState>((ref) {
  return AuthenticationNotifier(
    ref.watch(authServiceProvider),
    ref.watch(apiServiceProvider),
  );
});
