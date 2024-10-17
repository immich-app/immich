import 'package:get_it/get_it.dart';
import 'package:immich_mobile/domain/interfaces/album.interface.dart';
import 'package:immich_mobile/domain/interfaces/album_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/album_etag.interface.dart';
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
import 'package:immich_mobile/domain/services/server_info.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/platform/messages.g.dart';
import 'package:immich_mobile/presentation/modules/theme/states/app_theme.state.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:immich_mobile/presentation/states/current_user.state.dart';
import 'package:immich_mobile/presentation/states/gallery_permission.state.dart';
import 'package:immich_mobile/presentation/states/server_info/server_feature_config.state.dart';
import 'package:immich_mobile/utils/immich_api_client.dart';

final di = GetIt.I;

class ServiceLocator {
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
  }

  static void configureServicesForIsolate({
    required DriftDatabaseRepository database,
    required ImApiClient apiClient,
  }) {
    _registerSingleton(database);
    _registerSingleton(apiClient);

    _registerRepositories();
    registerPostValidationServices();
  }

  static void _registerRepositories() {
    /// Repositories
    _registerSingleton<IDatabaseRepository>(di<DriftDatabaseRepository>());
    _registerFactory<IStoreRepository>(() => StoreRepository(di()));
    _registerFactory<ILogRepository>(() => LogRepository(di()));
    _registerFactory<AppSettingService>(() => AppSettingService(di()));
    _registerFactory<IUserRepository>(() => UserRepository(di()));
    _registerFactory<IAssetRepository>(() => AssetRepository(di()));
    _registerFactory<IAlbumRepository>(() => AlbumRepository(di()));
    _registerFactory<IDeviceAssetRepository>(
      () => const DeviceAssetRepository(),
    );
    _registerFactory<IRenderListRepository>(() => RenderListRepository(di()));
    _registerFactory<IDeviceAssetToHashRepository>(
      () => DeviceAssetToHashRepository(di()),
    );
    _registerFactory<IDeviceAlbumRepository>(
      () => const DeviceAlbumRepository(),
    );
    _registerFactory<IAlbumToAssetRepository>(
      () => AlbumToAssetRepository(di()),
    );
    _registerFactory<IAlbumETagRepository>(() => AlbumETagRepository(di()));

    /// Services
    _registerFactory<LoginService>(() => const LoginService());
    _registerSingleton(ImHostService());
    _registerSingleton(const AlbumSyncService());
    _registerFactory<HashService>(() => HashService(
          hostService: di(),
          assetToHashRepo: di(),
          deviceAlbumRepo: di(),
          deviceAssetRepo: di(),
        ));
  }

  static void _registerPreGlobalStates() {
    _registerSingleton(AppRouter());
    _registerLazySingleton<AppThemeCubit>(() => AppThemeCubit(di()));
    _registerSingleton(GalleryPermissionNotifier());
  }

  static void registerApiClient(String endpoint) {
    _registerSingleton(ImApiClient(endpoint: endpoint));
  }

  static void registerPostValidationServices() {
    _registerFactory<UserService>(() => UserService(
          di<ImApiClient>().getUsersApi(),
        ));
    _registerFactory<ServerInfoService>(() => ServerInfoService(
          di<ImApiClient>().getServerApi(),
        ));
    _registerSingleton(const AssetSyncService());
  }

  static void registerPostGlobalStates() {
    _registerLazySingleton<ServerFeatureConfigCubit>(
      () => ServerFeatureConfigCubit(di()),
    );
  }

  static void registerCurrentUser(User user) {
    _registerSingleton(CurrentUserCubit(user));
  }
}
