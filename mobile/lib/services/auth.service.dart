import 'dart:async';
import 'dart:io';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/utils/background_sync.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/models/auth/auxilary_endpoint.model.dart';
import 'package:immich_mobile/models/auth/login_response.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/repositories/auth.repository.dart';
import 'package:immich_mobile/repositories/auth_api.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/services/network.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

final authServiceProvider = Provider(
  (ref) => AuthService(
    ref.watch(authApiRepositoryProvider),
    ref.watch(authRepositoryProvider),
    ref.watch(apiServiceProvider),
    ref.watch(networkServiceProvider),
    ref.watch(backgroundSyncProvider),
    ref.watch(appSettingsServiceProvider),
  ),
);

class AuthService {
  final AuthApiRepository _authApiRepository;
  final AuthRepository _authRepository;
  final ApiService _apiService;
  final NetworkService _networkService;
  final BackgroundSyncManager _backgroundSyncManager;
  final AppSettingsService _appSettingsService;
  final _log = Logger("AuthService");

  AuthService(
    this._authApiRepository,
    this._authRepository,
    this._apiService,
    this._networkService,
    this._backgroundSyncManager,
    this._appSettingsService,
  );

  /// Validates the provided server URL by resolving and setting the endpoint.
  /// Also sets the device info header and stores the valid URL.
  ///
  /// [url] - The server URL to be validated.
  ///
  /// Returns the validated and resolved server URL as a [String].
  ///
  /// Throws an exception if the URL cannot be resolved or set.
  Future<String> validateServerUrl(String url) async {
    final validUrl = await _apiService.resolveAndSetEndpoint(url);
    await _apiService.setDeviceInfoHeader();
    await Store.put(StoreKey.serverUrl, validUrl);

    return validUrl;
  }

  Future<bool> validateAuxilaryServerUrl(String url) async {
    final httpclient = HttpClient();
    bool isValid = false;

    try {
      final uri = Uri.parse('$url/users/me');
      final request = await httpclient.getUrl(uri);

      // add auth token + any configured custom headers
      final customHeaders = ApiService.getRequestHeaders();
      customHeaders.forEach((key, value) {
        request.headers.add(key, value);
      });

      final response = await request.close();
      if (response.statusCode == 200) {
        isValid = true;
      }
    } catch (error) {
      _log.severe("Error validating auxiliary endpoint", error);
    } finally {
      httpclient.close();
    }

    return isValid;
  }

  Future<LoginResponse> login(String email, String password) {
    return _authApiRepository.login(email, password);
  }

  /// Performs user logout operation by making a server request and clearing local data.
  ///
  /// This method attempts to log out the user through the authentication API repository.
  /// If the server request fails, the error is logged but local data is still cleared.
  /// The local data cleanup is guaranteed to execute regardless of the server request outcome.
  ///
  /// Throws any unhandled exceptions from the API request or local data clearing operations.
  Future<void> logout() async {
    try {
      await _authApiRepository.logout();
    } catch (error, stackTrace) {
      _log.severe("Error logging out", error, stackTrace);
    } finally {
      await clearLocalData().catchError((error, stackTrace) {
        _log.severe("Error clearing local data", error, stackTrace);
      });

      await _appSettingsService.setSetting(AppSettingsEnum.enableBackup, false);
    }
  }

  /// Clears all local authentication-related data.
  ///
  /// This method performs a concurrent deletion of:
  /// - Authentication repository data
  /// - Current user information
  /// - Access token
  /// - Asset ETag
  ///
  /// All deletions are executed in parallel using [Future.wait].
  Future<void> clearLocalData() async {
    // Cancel any ongoing background sync operations before clearing data
    await _backgroundSyncManager.cancel();
    await Future.wait([
      _authRepository.clearLocalData(),
      Store.delete(StoreKey.currentUser),
      Store.delete(StoreKey.accessToken),
      Store.delete(StoreKey.assetETag),
      Store.delete(StoreKey.autoEndpointSwitching),
      Store.delete(StoreKey.preferredWifiName),
      Store.delete(StoreKey.localEndpoint),
      Store.delete(StoreKey.externalEndpointList),
    ]);
  }

  Future<void> changePassword(String newPassword) {
    try {
      return _authApiRepository.changePassword(newPassword);
    } catch (error, stackTrace) {
      _log.severe("Error changing password", error, stackTrace);
      rethrow;
    }
  }

  Future<String?> setOpenApiServiceEndpoint() async {
    final enable = _authRepository.getEndpointSwitchingFeature();
    if (!enable) {
      return null;
    }

    final wifiName = await _networkService.getWifiName();
    final savedWifiName = _authRepository.getPreferredWifiName();
    String? endpoint;

    if (wifiName == savedWifiName) {
      endpoint = await _setLocalConnection();
    }

    endpoint ??= await _setRemoteConnection();

    return endpoint;
  }

  Future<String?> _setLocalConnection() async {
    try {
      final localEndpoint = _authRepository.getLocalEndpoint();
      if (localEndpoint != null) {
        await _apiService.resolveAndSetEndpoint(localEndpoint);
        return localEndpoint;
      }
    } catch (error, stackTrace) {
      _log.severe("Cannot set local endpoint", error, stackTrace);
    }

    return null;
  }

  Future<String?> _setRemoteConnection() async {
    List<AuxilaryEndpoint> endpointList;

    try {
      endpointList = _authRepository.getExternalEndpointList();
    } catch (error, stackTrace) {
      _log.severe("Cannot get external endpoint", error, stackTrace);
      return null;
    }

    for (final endpoint in endpointList) {
      try {
        return await _apiService.resolveAndSetEndpoint(endpoint.url);
      } on ApiException catch (error) {
        _log.severe("Cannot resolve endpoint", error);
        continue;
      } catch (_) {
        _log.severe("Auxiliary server is not valid");
        continue;
      }
    }

    return null;
  }

  /// Changes the primary server endpoint while keeping the user logged in.
  /// 
  /// This method validates that the new endpoint accepts the current access token
  /// before updating the stored endpoint. This allows users to update their server
  /// URL (e.g., after changing IP, domain, or port) without having to log out
  /// and reconfigure all settings.
  /// 
  /// [newUrl] - The new server URL to switch to.
  /// 
  /// Returns the validated endpoint URL if successful, or throws an exception if:
  /// - The new server cannot be reached
  /// - The current access token is not valid on the new server
  Future<String> changeServerEndpoint(String newUrl) async {
    // First, resolve the new endpoint
    final validUrl = await _apiService.resolveEndpoint(newUrl);
    
    // Temporarily set the new endpoint to validate the access token
    final currentEndpoint = Store.tryGet(StoreKey.serverEndpoint);
    
    try {
      _apiService.setEndpoint(validUrl);
      
      // Verify that the current access token works with the new endpoint
      // by making an authenticated request
      final accessToken = Store.tryGet(StoreKey.accessToken);
      if (accessToken == null) {
        throw ApiException(401, "No access token available");
      }
      
      // Try to get user info to verify the token is valid on this server
      await _apiService.usersApi.getMyUser();
      
      // If we get here, the token is valid on the new server
      // Save the new endpoint
      await Store.put(StoreKey.serverEndpoint, validUrl);
      await Store.put(StoreKey.serverUrl, newUrl);
      
      _log.info("Successfully changed server endpoint to: $validUrl");
      return validUrl;
    } catch (error, stackTrace) {
      // Restore the original endpoint if validation failed
      if (currentEndpoint != null) {
        _apiService.setEndpoint(currentEndpoint);
      }
      _log.severe("Failed to change server endpoint", error, stackTrace);
      rethrow;
    }
  }

  /// Validates a new server endpoint without changing the current connection.
  /// 
  /// Returns true if the new endpoint is reachable and accepts the current access token.
  Future<bool> validateNewEndpoint(String newUrl) async {
    try {
      final validUrl = await _apiService.resolveEndpoint(newUrl);
      return await validateAuxilaryServerUrl(validUrl);
    } catch (error) {
      _log.severe("Error validating new endpoint", error);
      return false;
    }
  }

  Future<bool> unlockPinCode(String pinCode) {
    return _authApiRepository.unlockPinCode(pinCode);
  }

  Future<void> lockPinCode() {
    return _authApiRepository.lockPinCode();
  }

  Future<void> setupPinCode(String pinCode) {
    return _authApiRepository.setupPinCode(pinCode);
  }
}
