import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/modules/login/models/authentication_state.model.dart';
import 'package:immich_mobile/modules/login/models/hive_saved_login_info.model.dart';
import 'package:immich_mobile/modules/backup/services/backup.service.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/shared/services/device_info.service.dart';
import 'package:immich_mobile/utils/hash.dart';
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
        Hive.box(userInfoBox).delete(accessTokenKey),
        Store.delete(StoreKey.assetETag),
        Store.delete(StoreKey.userRemoteId),
        Store.delete(StoreKey.currentUser),
        Hive.box<HiveSavedLoginInfo>(hiveLoginInfoBox).delete(savedLoginInfoKey)
      ]);

      state = state.copyWith(isAuthenticated: false);

      return true;
    } catch (e) {
      debugPrint("Error logging out $e");
      return false;
    }
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
      var userInfoHiveBox = await Hive.openBox(userInfoBox);
      var deviceInfo = await _deviceInfoService.getDeviceInfo();
      userInfoHiveBox.put(deviceIdKey, deviceInfo["deviceId"]);
      userInfoHiveBox.put(accessTokenKey, accessToken);
      Store.put(StoreKey.deviceId, deviceInfo["deviceId"]);
      Store.put(StoreKey.deviceIdHash, fastHash(deviceInfo["deviceId"]));
      Store.put(StoreKey.userRemoteId, userResponseDto.id);
      Store.put(StoreKey.currentUser, User.fromDto(userResponseDto));

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

      // Save login info to local storage
      Hive.box<HiveSavedLoginInfo>(hiveLoginInfoBox).put(
        savedLoginInfoKey,
        HiveSavedLoginInfo(
          email: "",
          password: "",
          serverUrl: serverUrl,
          accessToken: accessToken,
        ),
      );
    }

    // Register device info
    try {
      DeviceInfoResponseDto? deviceInfo =
          await _apiService.deviceInfoApi.upsertDeviceInfo(
        UpsertDeviceInfoDto(
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
      return e is ApiException && e.innerException is SocketException;
    }

    return true;
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
