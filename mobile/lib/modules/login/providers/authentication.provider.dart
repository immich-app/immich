import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/login/models/authentication_state.model.dart';
import 'package:immich_mobile/modules/login/models/hive_saved_login_info.model.dart';
import 'package:immich_mobile/modules/backup/services/backup.service.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/shared/services/device_info.service.dart';
import 'package:openapi/api.dart';

class AuthenticationNotifier extends StateNotifier<AuthenticationState> {
  AuthenticationNotifier(
    this._deviceInfoService,
    this._backupService,
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
            deviceInfo: DeviceInfoResponseDto(
              id: 0,
              userId: "",
              deviceId: "",
              deviceType: DeviceTypeEnum.ANDROID,
              createdAt: "",
              isAutoBackup: false,
            ),
          ),
        );

  final DeviceInfoService _deviceInfoService;
  final BackupService _backupService;
  final ApiService _apiService;

  Future<bool> login(
    String email,
    String password,
    String serverEndpoint,
    bool isSavedLoginInfo,
  ) async {
    // Store server endpoint to Hive and test endpoint
    if (serverEndpoint[serverEndpoint.length - 1] == "/") {
      var validUrl = serverEndpoint.substring(0, serverEndpoint.length - 1);
      Hive.box(userInfoBox).put(serverEndpointKey, validUrl);
    } else {
      Hive.box(userInfoBox).put(serverEndpointKey, serverEndpoint);
    }

    // Check Server URL validity
    try {
      _apiService.setEndpoint(Hive.box(userInfoBox).get(serverEndpointKey));
      await _apiService.serverInfoApi.pingServer();
    } catch (e) {
      debugPrint('Invalid Server Endpoint Url $e');
      return false;
    }

    // Store device id to local storage
    var deviceInfo = await _deviceInfoService.getDeviceInfo();
    Hive.box(userInfoBox).put(deviceIdKey, deviceInfo["deviceId"]);

    state = state.copyWith(
      deviceId: deviceInfo["deviceId"],
      deviceType: deviceInfo["deviceType"],
    );

    // Make sign-in request
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

      Hive.box(userInfoBox).put(accessTokenKey, loginResponse.accessToken);

      state = state.copyWith(
        isAuthenticated: true,
        userId: loginResponse.userId,
        userEmail: loginResponse.userEmail,
        firstName: loginResponse.firstName,
        lastName: loginResponse.lastName,
        profileImagePath: loginResponse.profileImagePath,
        isAdmin: loginResponse.isAdmin,
        shouldChangePassword: loginResponse.shouldChangePassword,
      );

      // Login Success - Set Access Token to API Client
      _apiService.setAccessToken(loginResponse.accessToken);

      if (isSavedLoginInfo) {
        // Save login info to local storage
        Hive.box<HiveSavedLoginInfo>(hiveLoginInfoBox).put(
          savedLoginInfoKey,
          HiveSavedLoginInfo(
            email: email,
            password: password,
            isSaveLogin: true,
            serverUrl: Hive.box(userInfoBox).get(serverEndpointKey),
          ),
        );
      } else {
        Hive.box<HiveSavedLoginInfo>(hiveLoginInfoBox)
            .delete(savedLoginInfoKey);
      }
    } catch (e) {
      debugPrint("Error logging in $e");
      return false;
    }

    // Register device info
    try {
      DeviceInfoResponseDto? deviceInfo =
          await _apiService.deviceInfoApi.createDeviceInfo(
        CreateDeviceInfoDto(
          deviceId: state.deviceId,
          deviceType: state.deviceType,
        ),
      );

      if (deviceInfo == null) {
        debugPrint('Device Info Response is null');
        return false;
      }

      state = state.copyWith(deviceInfo: deviceInfo);
    } catch (e) {
      debugPrint("ERROR Register Device Info: $e");
      return false;
    }

    return true;
  }

  Future<bool> logout() async {
    Hive.box(userInfoBox).delete(accessTokenKey);
    state = state.copyWith(isAuthenticated: false);

    return true;
  }

  setAutoBackup(bool backupState) async {
    var deviceInfo = await _deviceInfoService.getDeviceInfo();
    var deviceId = deviceInfo["deviceId"];

    DeviceTypeEnum deviceType = deviceInfo["deviceType"];

    DeviceInfoResponseDto updatedDeviceInfo =
        await _backupService.setAutoBackup(backupState, deviceId, deviceType);

    state = state.copyWith(deviceInfo: updatedDeviceInfo);
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
}

final authenticationProvider =
    StateNotifierProvider<AuthenticationNotifier, AuthenticationState>((ref) {
  return AuthenticationNotifier(
    ref.watch(deviceInfoServiceProvider),
    ref.watch(backupServiceProvider),
    ref.watch(apiServiceProvider),
  );
});
