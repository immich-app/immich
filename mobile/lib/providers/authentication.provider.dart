import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_udid/flutter_udid.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/models/authentication/authentication_state.model.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/db.dart';
import 'package:immich_mobile/utils/hash.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class AuthenticationNotifier extends StateNotifier<AuthenticationState> {
  AuthenticationNotifier(
    this._apiService,
    this._db,
    this._ref,
  ) : super(
          AuthenticationState(
            deviceId: "",
            userId: "",
            userEmail: "",
            name: '',
            profileImagePath: '',
            isAdmin: false,
            shouldChangePassword: false,
            isAuthenticated: false,
          ),
        );

  final ApiService _apiService;
  final Isar _db;
  final StateNotifierProviderRef<AuthenticationNotifier, AuthenticationState>
      _ref;
  final _log = Logger("AuthenticationNotifier");

  Future<bool> login(
    String email,
    String password,
    String serverUrl,
  ) async {
    try {
      // Resolve API server endpoint from user provided serverUrl
      await _apiService.resolveAndSetEndpoint(serverUrl);
      await _apiService.serverInfoApi.pingServer();
    } catch (e) {
      debugPrint('Invalid Server Endpoint Url $e');
      return false;
    }

    // Make sign-in request
    DeviceInfoPlugin deviceInfoPlugin = DeviceInfoPlugin();

    if (Platform.isIOS) {
      var iosInfo = await deviceInfoPlugin.iosInfo;
      _apiService.authenticationApi.apiClient
          .addDefaultHeader('deviceModel', iosInfo.utsname.machine);
      _apiService.authenticationApi.apiClient
          .addDefaultHeader('deviceType', 'iOS');
    } else {
      var androidInfo = await deviceInfoPlugin.androidInfo;
      _apiService.authenticationApi.apiClient
          .addDefaultHeader('deviceModel', androidInfo.model);
      _apiService.authenticationApi.apiClient
          .addDefaultHeader('deviceType', 'Android');
    }

    try {
      var loginResponse = await _apiService.authenticationApi.login(
        LoginCredentialDto(
          email: email,
          password: password,
        ),
      );

      if (loginResponse == null) {
        debugPrint('Login Response is null');
        return false;
      }

      return setSuccessLoginInfo(
        accessToken: loginResponse.accessToken,
        serverUrl: serverUrl,
      );
    } catch (e) {
      debugPrint("Error logging in $e");
      return false;
    }
  }

  Future<void> logout() async {
    var log = Logger('AuthenticationNotifier');
    try {
      String? userEmail = Store.tryGet(StoreKey.currentUser)?.email;

      await _apiService.authenticationApi
          .logout()
          .then((_) => log.info("Logout was successful for $userEmail"))
          .onError(
            (error, stackTrace) =>
                log.severe("Logout failed for $userEmail", error, stackTrace),
          );

      await Future.wait([
        clearAssetsAndAlbums(_db),
        Store.delete(StoreKey.currentUser),
        Store.delete(StoreKey.accessToken),
      ]);
      _ref.invalidate(albumProvider);

      state = state.copyWith(
        deviceId: "",
        userId: "",
        userEmail: "",
        name: '',
        profileImagePath: '',
        isAdmin: false,
        shouldChangePassword: false,
        isAuthenticated: false,
      );
    } catch (e, stack) {
      log.severe('Logout failed', e, stack);
    }
  }

  updateUserProfileImagePath(String path) {
    state = state.copyWith(profileImagePath: path);
  }

  Future<bool> changePassword(String newPassword) async {
    try {
      await _apiService.usersApi.updateMyUser(
        UserUpdateMeDto(
          password: newPassword,
        ),
      );

      state = state.copyWith(shouldChangePassword: false);

      return true;
    } catch (e) {
      debugPrint("Error changing password $e");
      return false;
    }
  }

  Future<bool> setSuccessLoginInfo({
    required String accessToken,
    required String serverUrl,
  }) async {
    _apiService.setAccessToken(accessToken);

    // Get the deviceid from the store if it exists, otherwise generate a new one
    String deviceId =
        Store.tryGet(StoreKey.deviceId) ?? await FlutterUdid.consistentUdid;

    bool shouldChangePassword = false;
    User? user = Store.tryGet(StoreKey.currentUser);

    UserAdminResponseDto? userResponse;
    UserPreferencesResponseDto? userPreferences;
    try {
      final responses = await Future.wait([
        _apiService.usersApi.getMyUser().timeout(const Duration(seconds: 7)),
        _apiService.usersApi
            .getMyPreferences()
            .timeout(const Duration(seconds: 7)),
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
      Store.put(StoreKey.serverUrl, serverUrl);
      Store.put(StoreKey.accessToken, accessToken);

      shouldChangePassword = userResponse.shouldChangePassword;
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
      shouldChangePassword: shouldChangePassword,
      deviceId: deviceId,
    );

    return true;
  }
}

final authenticationProvider =
    StateNotifierProvider<AuthenticationNotifier, AuthenticationState>((ref) {
  return AuthenticationNotifier(
    ref.watch(apiServiceProvider),
    ref.watch(dbProvider),
    ref,
  );
});
