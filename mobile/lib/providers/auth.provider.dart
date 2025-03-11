import 'package:flutter/foundation.dart';
import 'package:flutter_udid/flutter_udid.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/utils/user.converter.dart';
import 'package:immich_mobile/models/auth/auth_state.model.dart';
import 'package:immich_mobile/models/auth/login_response.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/auth.service.dart';
import 'package:immich_mobile/utils/hash.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.watch(authServiceProvider),
    ref.watch(apiServiceProvider),
  );
});

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;
  final ApiService _apiService;
  final _log = Logger("AuthenticationNotifier");

  static const Duration _timeoutDuration = Duration(seconds: 7);

  AuthNotifier(
    this._authService,
    this._apiService,
  ) : super(
          AuthState(
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

  /// Validating the url is the alternative connecting server url without
  /// saving the information to the local database
  Future<bool> validateAuxilaryServerUrl(String url) async {
    try {
      final validEndpoint = await _apiService.resolveEndpoint(url);
      return await _authService.validateAuxilaryServerUrl(validEndpoint);
    } catch (_) {
      return false;
    }
  }

  Future<LoginResponse> login(String email, String password) async {
    final response = await _authService.login(email, password);
    await saveAuthInfo(accessToken: response.accessToken);
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
    state = AuthState(
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

  Future<bool> saveAuthInfo({
    required String accessToken,
  }) async {
    await _apiService.setAccessToken(accessToken);

    // Get the deviceid from the store if it exists, otherwise generate a new one
    String deviceId =
        Store.tryGet(StoreKey.deviceId) ?? await FlutterUdid.consistentUdid;

    UserDto? user = Store.tryGet(StoreKey.currentUser);

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

      if (kDebugMode) {
        debugPrint(
          "Error getting user information from the server [CATCH ALL] $error $stackTrace",
        );
      }
    }

    // If the user information is successfully retrieved, update the store
    // Due to the flow of the code, this will always happen on first login
    if (userResponse == null) {
      _log.severe("Unable to get user information from the server.");
    } else {
      await Store.put(StoreKey.deviceId, deviceId);
      await Store.put(StoreKey.deviceIdHash, fastHash(deviceId));
      await Store.put(
        StoreKey.currentUser,
        UserConverter.fromAdminDto(userResponse, userPreferences),
      );
      await Store.put(StoreKey.accessToken, accessToken);

      user = UserConverter.fromAdminDto(userResponse, userPreferences);
    }

    // If the user is null, the login was not successful
    // and we don't have a local copy of the user from a prior successful login
    if (user == null) {
      return false;
    }

    state = state.copyWith(
      isAuthenticated: true,
      userId: user.uid,
      userEmail: user.email,
      name: user.name,
      profileImagePath: user.profileImagePath,
      isAdmin: user.isAdmin,
      deviceId: deviceId,
    );

    return true;
  }

  Future<void> saveWifiName(String wifiName) async {
    await Store.put(StoreKey.preferredWifiName, wifiName);
  }

  Future<void> saveLocalEndpoint(String url) async {
    await Store.put(StoreKey.localEndpoint, url);
  }

  String? getSavedWifiName() {
    return Store.tryGet(StoreKey.preferredWifiName);
  }

  String? getSavedLocalEndpoint() {
    return Store.tryGet(StoreKey.localEndpoint);
  }

  /// Returns the current server endpoint (with /api) URL from the store
  String? getServerEndpoint() {
    return Store.tryGet(StoreKey.serverEndpoint);
  }

  /// Returns the current server URL (input by the user) from the store
  String? getServerUrl() {
    return Store.tryGet(StoreKey.serverUrl);
  }

  Future<String?> setOpenApiServiceEndpoint() {
    return _authService.setOpenApiServiceEndpoint();
  }
}
