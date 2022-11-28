import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/login/models/authentication_state.model.dart';
import 'package:immich_mobile/modules/login/models/hive_saved_login_info.model.dart';
import 'package:immich_mobile/modules/backup/services/backup.service.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/value.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/shared/services/device_info.service.dart';
import 'package:isar/isar.dart';
import 'package:openapi/api.dart';

class AuthenticationNotifier extends StateNotifier<AuthenticationState> {
  AuthenticationNotifier(
    this._deviceInfoService,
    this._backupService,
    this._apiService,
    this._db,
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
  final Isar _db;

  Future<bool> login(
    String email,
    String password,
    String serverUrl,
    bool isSavedLoginInfo,
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
        isSavedLoginInfo: isSavedLoginInfo,
      );
    } catch (e) {
      HapticFeedback.vibrate();
      debugPrint("Error logging in $e");
      return false;
    }
  }

  Future<bool> logout() async {
    state = state.copyWith(isAuthenticated: false);
    await Future.wait([
      Hive.box(userInfoBox).delete(accessTokenKey),
      Hive.box(userInfoBox).delete(assetEtagKey),
    ]);
    await _db.writeTxn(() async {
      await _db.assets.clear();
      await _db.albums.clear();
      await _db.users.clear();
      await _db.values.clear();
    });

    // Remove login info from local storage
    var loginInfo =
        Hive.box<HiveSavedLoginInfo>(hiveLoginInfoBox).get(savedLoginInfoKey);
    if (loginInfo != null) {
      loginInfo.email = "";
      loginInfo.password = "";
      loginInfo.isSaveLogin = false;

      await Hive.box<HiveSavedLoginInfo>(hiveLoginInfoBox).put(
        savedLoginInfoKey,
        loginInfo,
      );
    }
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

  Future<bool> setSuccessLoginInfo({
    required String accessToken,
    required String serverUrl,
    required bool isSavedLoginInfo,
  }) async {
    _apiService.setAccessToken(accessToken);
    final Id loggedInUserId = await _db.values.getInt(DbKey.loggedInUser);
    final User? loggedInUser = await _db.users.get(loggedInUserId);
    User? user;
    bool shouldChangePassword = false;
    try {
      final dto = await _apiService.userApi.getMyUserInfo();
      user = dto == null ? null : User.fromDto(dto);
      shouldChangePassword = dto?.shouldChangePassword ?? false;
    } catch (e) {
      if (e is ApiException &&
          e.code == HttpStatus.badRequest &&
          e.innerException is SocketException) {
        // offline? use cached info
        user = loggedInUser;
      }
    }

    if (user != null) {
      if (user != loggedInUser) {
        await _db.writeTxn(() async {
          await _db.users.put(user!);
          await _db.values.setInt(DbKey.loggedInUser, user.isarId);
        });
      }
      var deviceInfo = await _deviceInfoService.getDeviceInfo();
      final box = await Hive.openBox(userInfoBox);
      box.put(deviceIdKey, deviceInfo["deviceId"]);
      box.put(accessTokenKey, accessToken);
      box.put(serverEndpointKey, serverUrl);

      state = state.copyWith(
        isAuthenticated: true,
        userId: user.id,
        userEmail: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImagePath: user.profileImagePath,
        isAdmin: user.isAdmin,
        shouldChangePassword: shouldChangePassword,
        deviceId: deviceInfo["deviceId"],
        deviceType: deviceInfo["deviceType"],
      );

      if (isSavedLoginInfo) {
        // Save login info to local storage
        Hive.box<HiveSavedLoginInfo>(hiveLoginInfoBox).put(
          savedLoginInfoKey,
          HiveSavedLoginInfo(
            email: "",
            password: "",
            isSaveLogin: true,
            serverUrl: serverUrl,
            accessToken: accessToken,
          ),
        );
      } else {
        Hive.box<HiveSavedLoginInfo>(hiveLoginInfoBox)
            .delete(savedLoginInfoKey);
      }
    } else {
      return false;
    }

    // Register device info
    DeviceInfoResponseDto? deviceInfo;
    try {
      deviceInfo = await _apiService.deviceInfoApi.upsertDeviceInfo(
        UpsertDeviceInfoDto(
          deviceId: state.deviceId,
          deviceType: state.deviceType,
        ),
      );

      if (deviceInfo == null) {
        debugPrint('Device Info Response is null');
        return false;
      }
      final json = deviceInfo.toJson();
      await _db.writeTxn(() => _db.values.setJson(DbKey.deviceInfo, json));
    } catch (e) {
      if (e is ApiException &&
          e.code == HttpStatus.badRequest &&
          e.innerException is SocketException) {
        // offline? use cached info
        deviceInfo = await _db.values.getJson(DbKey.deviceInfo);
      }
      if (deviceInfo == null) {
        debugPrint("ERROR Register Device Info: $e");
        return false;
      }
    }
    state = state.copyWith(deviceInfo: deviceInfo);

    return true;
  }
}

final authenticationProvider =
    StateNotifierProvider<AuthenticationNotifier, AuthenticationState>((ref) {
  return AuthenticationNotifier(
    ref.watch(deviceInfoServiceProvider),
    ref.watch(backupServiceProvider),
    ref.watch(apiServiceProvider),
    ref.watch(dbProvider),
  );
});
