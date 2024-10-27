import 'package:get_it/get_it.dart';
import 'package:immich_mobile/domain/interfaces/album.interface.dart';
import 'package:immich_mobile/domain/interfaces/album_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/album_etag.interface.dart';
import 'package:immich_mobile/domain/interfaces/api/authentication_api.interface.dart';
import 'package:immich_mobile/domain/interfaces/api/server_api.interface.dart';
import 'package:immich_mobile/domain/interfaces/api/sync_api.interface.dart';
import 'package:immich_mobile/domain/interfaces/api/user_api.interface.dart';
import 'package:immich_mobile/domain/interfaces/asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/database.interface.dart';
import 'package:immich_mobile/domain/interfaces/device_album.interface.dart';
import 'package:immich_mobile/domain/interfaces/device_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/device_asset_hash.interface.dart';
import 'package:immich_mobile/domain/interfaces/log.interface.dart';
import 'package:immich_mobile/domain/interfaces/renderlist.interface.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/repositories/album.repository.dart';
import 'package:immich_mobile/domain/repositories/album_asset.repository.dart';
import 'package:immich_mobile/domain/repositories/album_etag.repository.dart';
import 'package:immich_mobile/domain/repositories/api/authentication_api.repository.dart';
import 'package:immich_mobile/domain/repositories/api/server_api.repository.dart';
import 'package:immich_mobile/domain/repositories/api/sync_api.repository.dart';
import 'package:immich_mobile/domain/repositories/api/user_api.repository.dart';
import 'package:immich_mobile/domain/repositories/asset.repository.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/domain/repositories/device_album.repository.dart';
import 'package:immich_mobile/domain/repositories/device_asset.repository.dart';
import 'package:immich_mobile/domain/repositories/device_asset_hash.repository.dart';
import 'package:immich_mobile/domain/repositories/log.repository.dart';
import 'package:immich_mobile/domain/repositories/renderlist.repository.dart';
import 'package:immich_mobile/domain/repositories/store.repository.dart';
import 'package:immich_mobile/domain/repositories/user.repository.dart';
import 'package:immich_mobile/domain/services/album_sync.service.dart';
import 'package:immich_mobile/domain/services/app_setting.service.dart';
import 'package:immich_mobile/domain/services/asset_sync.service.dart';
import 'package:immich_mobile/domain/services/hash.service.dart';
import 'package:immich_mobile/domain/services/login.service.dart';
import 'package:immich_mobile/platform/messages.g.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:immich_mobile/presentation/states/app_info.state.dart';
import 'package:immich_mobile/presentation/states/app_theme.state.dart';
import 'package:immich_mobile/presentation/states/current_user.state.dart';
import 'package:immich_mobile/presentation/states/gallery_permission.state.dart';
import 'package:immich_mobile/presentation/states/server_info.state.dart';
import 'package:immich_mobile/utils/immich_api_client.dart';

final di = GetIt.I;

abstract final class ServiceLocator {
  const ServiceLocator._internal();

  static void _registerFactory<T extends Object>(T Function() factoryFun) {
    if (!di.isRegistered<T>()) {
      di.registerFactory<T>(factoryFun);
    }
  }

  static void _registerSingleton<T extends Object>(T instance) {
    if (!di.isRegistered<T>()) {
      di.registerSingleton<T>(instance);
    }
  }

  static void _registerLazySingleton<T extends Object>(
    T Function() factoryFun,
  ) {
    if (!di.isRegistered<T>()) {
      di.registerLazySingleton<T>(factoryFun);
    }
  }

  static void configureServices() {
    _registerSingleton(DriftDatabaseRepository());
    _registerRepositories();
    _registerPreGlobalStates();
    _registerServices();
  }

  static void configureServicesForIsolate({
    required DriftDatabaseRepository database,
    required ImApiClient apiClient,
  }) {
    _registerSingleton(database);
    _registerSingleton(apiClient);

    _registerRepositories();
    _registerServices();
  }

  static void _registerRepositories() {
    // Used for transactions
    _registerSingleton<IDatabaseRepository>(di<DriftDatabaseRepository>());
    _registerSingleton(ImApiClient(endpoint: ''));

    _registerFactory<IStoreRepository>(() => StoreRepository(db: di()));
    _registerFactory<ILogRepository>(() => LogRepository(db: di()));
    _registerFactory<AppSettingService>(() => AppSettingService(store: di()));
    _registerFactory<IUserRepository>(() => UserRepository(db: di()));
    _registerFactory<IAssetRepository>(() => AssetRepository(db: di()));
    _registerFactory<IAlbumRepository>(() => AlbumRepository(db: di()));
    _registerFactory<IDeviceAssetRepository>(
      () => const DeviceAssetRepository(),
    );
    _registerFactory<IRenderListRepository>(
      () => RenderListRepository(db: di()),
    );
    _registerFactory<IDeviceAssetToHashRepository>(
      () => DeviceAssetToHashRepository(db: di()),
    );
    _registerFactory<IDeviceAlbumRepository>(
      () => const DeviceAlbumRepository(),
    );
    _registerFactory<IAlbumToAssetRepository>(
      () => AlbumToAssetRepository(db: di()),
    );

    /// API Repos
    _registerFactory<IAlbumETagRepository>(() => AlbumETagRepository(db: di()));
    _registerFactory<ISyncApiRepository>(
      () => SyncApiRepository(syncApi: di<ImApiClient>().syncApi),
    );
    _registerFactory<IServerApiRepository>(
      () => ServerApiRepository(serverApi: di<ImApiClient>().serverApi),
    );
    _registerFactory<IAuthenticationApiRepository>(
      () => AuthenticationApiRepository(
        authenticationApi: di<ImApiClient>().authenticationApi,
        oAuthApi: di<ImApiClient>().oAuthApi,
      ),
    );
    _registerFactory<IUserApiRepository>(
      () => UserApiRepository(usersApi: di<ImApiClient>().usersApi),
    );
  }

  static void _registerServices() {
    /// Special services. So they are initiated as singletons
    _registerSingleton(ImHostService());
    _registerSingleton(const AlbumSyncService());
    _registerSingleton(const AssetSyncService());

    ///
    _registerFactory<LoginService>(() => const LoginService());
    _registerFactory<HashService>(() => HashService(
          hostService: di(),
          deviceAssetRepo: di(),
          deviceAlbumRepo: di(),
          assetToHashRepo: di(),
        ));
  }

  static void _registerPreGlobalStates() {
    _registerSingleton(AppRouter());
    _registerLazySingleton<AppThemeProvider>(
      () => AppThemeProvider(settingsService: di()),
    );
    _registerSingleton(GalleryPermissionProvider());
    _registerSingleton(AppInfoProvider());
  }

  static void registerPostGlobalStates() {
    _registerLazySingleton<ServerInfoProvider>(
      () => ServerInfoProvider(serverApiRepo: di()),
    );
  }

  static Future<void> registerApiClient(String endpoint) async {
    await di.unregister<ImApiClient>();
    _registerSingleton(ImApiClient(endpoint: endpoint));
  }

  static void registerCurrentUser(User user) {
    _registerSingleton(CurrentUserProvider(user));
  }
}
