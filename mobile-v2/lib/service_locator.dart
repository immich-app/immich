import 'package:get_it/get_it.dart';
import 'package:immich_mobile/domain/interfaces/asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/log.interface.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/repositories/asset.repository.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/domain/repositories/log.repository.dart';
import 'package:immich_mobile/domain/repositories/store.repository.dart';
import 'package:immich_mobile/domain/repositories/user.repository.dart';
import 'package:immich_mobile/domain/services/app_setting.service.dart';
import 'package:immich_mobile/domain/services/asset_sync.service.dart';
import 'package:immich_mobile/domain/services/login.service.dart';
import 'package:immich_mobile/domain/services/server_info.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/presentation/modules/common/states/current_user.state.dart';
import 'package:immich_mobile/presentation/modules/common/states/server_info/server_feature_config.state.dart';
import 'package:immich_mobile/presentation/modules/theme/states/app_theme.state.dart';
import 'package:immich_mobile/presentation/router/router.dart';
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
    required ImmichApiClient apiClient,
  }) {
    _registerSingleton(database);
    _registerSingleton(apiClient);

    _registerRepositories();
    registerPostValidationServices();
  }

  static void _registerRepositories() {
    /// Repositories
    _registerFactory<IStoreRepository>(() => StoreDriftRepository(di()));
    _registerFactory<ILogRepository>(() => LogDriftRepository(di()));
    _registerFactory<AppSettingService>(() => AppSettingService(di()));
    _registerFactory<IUserRepository>(() => UserDriftRepository(di()));
    _registerFactory<IAssetRepository>(
      () => AssetDriftRepository(di()),
    );

    /// Services
    _registerFactory<LoginService>(() => const LoginService());
  }

  static void _registerPreGlobalStates() {
    _registerSingleton(AppRouter());
    _registerLazySingleton<AppThemeCubit>(() => AppThemeCubit(di()));
  }

  static void registerApiClient(String endpoint) {
    _registerSingleton(ImmichApiClient(endpoint: endpoint));
  }

  static void registerPostValidationServices() {
    _registerFactory<UserService>(() => UserService(
          di<ImmichApiClient>().getUsersApi(),
        ));
    _registerFactory<ServerInfoService>(() => ServerInfoService(
          di<ImmichApiClient>().getServerApi(),
        ));
    _registerFactory<AssetSyncService>(() => const AssetSyncService());
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
