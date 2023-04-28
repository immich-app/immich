import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/modules/login/models/authentication_state.model.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/shared/services/device_info.service.dart';
import 'package:immich_mobile/utils/hash.dart';
import 'package:openapi/api.dart';

class AuthenticationNotifier extends StateNotifier<AuthenticationState> {
  AuthenticationNotifier(
    this._deviceInfoService,
    this._apiService,
  ) : super(
          AuthenticationState(
            deviceId: "",
            deviceType: DeviceTypeEnum.ANDROID,
            userId: "",
            userEmail: "",
            firstName: '',
            lastName: '',
            profileImagePath: '',
            isAdmin: false,
            shouldChangePassword: false,
            isAuthenticated: false,
          ),
        );

  final DeviceInfoService _deviceInfoService;
  final ApiService _apiService;

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
          .addDefaultHeader('deviceModel', iosInfo.utsname.machine ?? '');
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
      HapticFeedback.vibrate();
      debugPrint("Error logging in $e");
      return false;
    }
  }

  Future<bool> logout() async {
    try {
      await Future.wait([
        _apiService.authenticationApi.logout(),
        Store.delete(StoreKey.assetETag),
        Store.delete(StoreKey.currentUser),
        Store.delete(StoreKey.accessToken),
      ]);

      state = state.copyWith(isAuthenticated: false);

      return true;
    } catch (e) {
      debugPrint("Error logging out $e");
      return false;
    }
  }

  updateUserProfileImagePath(String path) {
    state = state.copyWith(profileImagePath: path);
  }

  Future<bool> changePassword(String newPassword) async {
    try {
      await _apiService.userApi.updateUser(
        UpdateUserDto(
          id: state.userId,
          password: newPassword,
          shouldChangePassword: false,
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
    UserResponseDto? userResponseDto;
    try {
      userResponseDto = await _apiService.userApi.getMyUserInfo();
    } on ApiException catch (e) {
      if (e.innerException is SocketException) {
        state = state.copyWith(isAuthenticated: true);
      }
    }

    if (userResponseDto != null) {
      var deviceInfo = await _deviceInfoService.getDeviceInfo();
      Store.put(StoreKey.deviceId, deviceInfo["deviceId"]);
      Store.put(StoreKey.deviceIdHash, fastHash(deviceInfo["deviceId"]));
      Store.put(StoreKey.currentUser, User.fromDto(userResponseDto));
      Store.put(StoreKey.serverUrl, serverUrl);
      Store.put(StoreKey.accessToken, accessToken);

      state = state.copyWith(
        isAuthenticated: true,
        userId: userResponseDto.id,
        userEmail: userResponseDto.email,
        firstName: userResponseDto.firstName,
        lastName: userResponseDto.lastName,
        profileImagePath: userResponseDto.profileImagePath,
        isAdmin: userResponseDto.isAdmin,
        shouldChangePassword: userResponseDto.shouldChangePassword,
        deviceId: deviceInfo["deviceId"],
        deviceType: deviceInfo["deviceType"],
      );
    }
    return true;
  }
}

final authenticationProvider =
    StateNotifierProvider<AuthenticationNotifier, AuthenticationState>((ref) {
  return AuthenticationNotifier(
    ref.watch(deviceInfoServiceProvider),
    ref.watch(apiServiceProvider),
  );
});
