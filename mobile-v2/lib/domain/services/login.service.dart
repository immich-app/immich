import 'dart:async';
import 'dart:io';

import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:http/http.dart';
import 'package:immich_mobile/domain/interfaces/album.interface.dart';
import 'package:immich_mobile/domain/interfaces/album_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/album_etag.interface.dart';
import 'package:immich_mobile/domain/interfaces/api/authentication_api.interface.dart';
import 'package:immich_mobile/domain/interfaces/api/server_api.interface.dart';
import 'package:immich_mobile/domain/interfaces/api/user_api.interface.dart';
import 'package:immich_mobile/domain/interfaces/asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/album_sync.service.dart';
import 'package:immich_mobile/domain/services/asset_sync.service.dart';
import 'package:immich_mobile/presentation/states/gallery_permission.state.dart';
import 'package:immich_mobile/presentation/states/server_info.state.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/immich_api_client.dart';
import 'package:immich_mobile/utils/isolate_helper.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';

// Cannot add dependency repos to constructor as this requires the newly registered API client from login
// and not a cached repos from DI
class LoginService with LogMixin {
  const LoginService();

  Future<bool> isEndpointAvailable(Uri uri) async {
    String baseUrl = uri.toString();

    if (!baseUrl.endsWith('/api')) {
      baseUrl += '/api';
    }

    await ServiceLocator.registerApiClient(baseUrl);

    try {
      await di<IServerApiRepository>().pingServer();
    } catch (e) {
      log.e("Exception occured while validating endpoint", e);
      return false;
    }
    return true;
  }

  Future<String> resolveEndpoint(Uri uri, {Client? client}) async {
    String baseUrl = uri.toString();
    final d = client ?? ImApiClient(endpoint: baseUrl).client;

    try {
      // Check for well-known endpoint
      final res = await d.get(
        Uri.parse("$baseUrl/.well-known/immich"),
        headers: {"Accept": "application/json"},
      );

      if (res.statusCode == HttpStatus.ok) {
        final data = await IsolateHelper.decodeJson(res.bodyBytes);
        final endpoint = data['api']['endpoint'].toString();

        // Full URL is relative to base
        return endpoint.startsWith('/') ? "$baseUrl$endpoint" : endpoint;
      }
    } catch (e) {
      log.e("Could not locate /.well-known/immich at $baseUrl", e);
    }

    // No well-known, return the baseUrl
    return baseUrl;
  }

  Future<String?> passwordLogin(String email, String password) async {
    try {
      return await di<IAuthenticationApiRepository>().login(email, password);
    } catch (e, s) {
      log.e("Exception occured while performing password login", e, s);
    }
    return null;
  }

  Future<String?> oAuthLogin() async {
    const String oAuthCallbackSchema = 'app.immich';
    final authApi = di<IAuthenticationApiRepository>();

    try {
      final oAuthUrl = await authApi.startOAuth(
        redirectUri: "$oAuthCallbackSchema:/",
      );

      if (oAuthUrl == null) {
        log.e(
          "oAuth Server URL not available. Kindly ensure oAuth login is enabled in the server",
        );
        return null;
      }

      final oAuthCallbackUrl = await FlutterWebAuth2.authenticate(
        url: oAuthUrl,
        callbackUrlScheme: oAuthCallbackSchema,
      );

      return await authApi.finishOAuth(oAuthCallbackUrl);
    } catch (e) {
      log.e("Exception occured while performing oauth login", e);
    }
    return null;
  }

  Future<void> handlePostUrlResolution(String serverEndpoint) async {
    await ServiceLocator.registerApiClient(serverEndpoint);
    ServiceLocator.registerPostGlobalStates();

    // Fetch server features
    await di<ServerInfoProvider>().fetchFeatures();
  }

  Future<User?> handlePostLogin() async {
    final user = await di<IUserApiRepository>().getMyUser().timeout(
      const Duration(seconds: 10),
      // ignore: function-always-returns-null
      onTimeout: () {
        log.w("Timedout while fetching user details using saved credentials");
        return null;
      },
    );
    if (user == null) {
      return null;
    }

    ServiceLocator.registerCurrentUser(user);
    await di<ServerInfoProvider>().fetchServerDisk();

    // sync assets in background
    unawaited(di<AssetSyncService>().performFullRemoteSyncIsolate(user));
    if (di<GalleryPermissionProvider>().hasPermission) {
      unawaited(di<AlbumSyncService>().performFullDeviceSyncIsolate());
    }

    return user;
  }

  Future<bool> tryAutoLogin() async {
    final serverEndpoint =
        await di<IStoreRepository>().tryGet(StoreKey.serverEndpoint);
    if (serverEndpoint == null) {
      return false;
    }

    await handlePostUrlResolution(serverEndpoint);

    final accessToken =
        await di<IStoreRepository>().tryGet(StoreKey.accessToken);
    if (accessToken == null) {
      return false;
    }

    // Set token to interceptor
    await di<ImApiClient>().init(accessToken: accessToken);

    final user = await handlePostLogin();
    if (user == null) {
      return false;
    }

    return true;
  }

  Future<void> logout() async {
    // Remove existing assets
    await di<IAssetRepository>().deleteAll();
    await di<IAlbumRepository>().deleteAll();
    await di<IAlbumToAssetRepository>().deleteAll();
    await di<IAlbumETagRepository>().deleteAll();
    await di<IUserRepository>().deleteAll();
    await di<IStoreRepository>().delete(StoreKey.accessToken);
  }
}
