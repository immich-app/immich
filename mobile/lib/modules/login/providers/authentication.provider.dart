import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/login/models/authentication_state.model.dart';
import 'package:immich_mobile/modules/login/models/hive_saved_login_info.model.dart';
import 'package:immich_mobile/modules/login/models/login_response.model.dart';
import 'package:immich_mobile/shared/services/backup.service.dart';
import 'package:immich_mobile/shared/services/device_info.service.dart';
import 'package:immich_mobile/shared/services/network.service.dart';
import 'package:immich_mobile/shared/models/device_info.model.dart';

class AuthenticationNotifier extends StateNotifier<AuthenticationState> {
  AuthenticationNotifier(this.ref)
      : super(
          AuthenticationState(
            deviceId: "",
            deviceType: "",
            isAuthenticated: false,
            userId: "",
            userEmail: "",
            deviceInfo: DeviceInfoRemote(
              id: 0,
              userId: "",
              deviceId: "",
              deviceType: "",
              notificationToken: "",
              createdAt: "",
              isAutoBackup: false,
            ),
          ),
        );

  final Ref ref;
  final DeviceInfoService _deviceInfoService = DeviceInfoService();
  final BackupService _backupService = BackupService();
  final NetworkService _networkService = NetworkService();

  Future<bool> login(String email, String password, String serverEndpoint, bool isSavedLoginInfo) async {
    // Store server endpoint to Hive and test endpoint
    if (serverEndpoint[serverEndpoint.length - 1] == "/") {
      var validUrl = serverEndpoint.substring(0, serverEndpoint.length - 1);
      Hive.box(userInfoBox).put(serverEndpointKey, validUrl);
    } else {
      Hive.box(userInfoBox).put(serverEndpointKey, serverEndpoint);
    }

    try {
      bool isServerEndpointVerified = await _networkService.pingServer();
      if (!isServerEndpointVerified) {
        return false;
      }
    } catch (e) {
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
      Response res = await _networkService.postRequest(url: 'auth/login', data: {'email': email, 'password': password});

      var payload = LogInReponse.fromJson(res.toString());

      Hive.box(userInfoBox).put(accessTokenKey, payload.accessToken);

      state = state.copyWith(
        isAuthenticated: true,
        userId: payload.userId,
        userEmail: payload.userEmail,
      );

      if (isSavedLoginInfo) {
        // Save login info to local storage
        Hive.box<HiveSavedLoginInfo>(hiveLoginInfoBox).put(
          savedLoginInfoKey,
          HiveSavedLoginInfo(
              email: email,
              password: password,
              isSaveLogin: true,
              serverUrl: Hive.box(userInfoBox).get(serverEndpointKey)),
        );
      } else {
        Hive.box<HiveSavedLoginInfo>(hiveLoginInfoBox).delete(savedLoginInfoKey);
      }
    } catch (e) {
      return false;
    }

    // Register device info
    try {
      Response res = await _networkService
          .postRequest(url: 'device-info', data: {'deviceId': state.deviceId, 'deviceType': state.deviceType});

      DeviceInfoRemote deviceInfo = DeviceInfoRemote.fromJson(res.toString());
      state = state.copyWith(deviceInfo: deviceInfo);
    } catch (e) {
      debugPrint("ERROR Register Device Info: $e");
    }

    return true;
  }

  Future<bool> logout() async {
    Hive.box(userInfoBox).delete(accessTokenKey);
    state = AuthenticationState(
      deviceId: "",
      deviceType: "",
      isAuthenticated: false,
      userId: "",
      userEmail: "",
      deviceInfo: DeviceInfoRemote(
        id: 0,
        userId: "",
        deviceId: "",
        deviceType: "",
        notificationToken: "",
        createdAt: "",
        isAutoBackup: false,
      ),
    );

    return true;
  }

  setAutoBackup(bool backupState) async {
    var deviceInfo = await _deviceInfoService.getDeviceInfo();
    var deviceId = deviceInfo["deviceId"];
    var deviceType = deviceInfo["deviceType"];

    DeviceInfoRemote deviceInfoRemote = await _backupService.setAutoBackup(backupState, deviceId, deviceType);
    state = state.copyWith(deviceInfo: deviceInfoRemote);
  }
}

final authenticationProvider = StateNotifierProvider<AuthenticationNotifier, AuthenticationState>((ref) {
  return AuthenticationNotifier(ref);
});
