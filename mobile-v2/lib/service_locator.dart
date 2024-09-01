import 'package:get_it/get_it.dart';
import 'package:immich_mobile/domain/interfaces/log.interface.dart';
import 'package:immich_mobile/domain/interfaces/remote_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/domain/repositories/log.repository.dart';
import 'package:immich_mobile/domain/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/domain/repositories/store.repository.dart';
import 'package:immich_mobile/domain/repositories/user.repository.dart';
import 'package:immich_mobile/domain/services/app_setting.service.dart';
import 'package:immich_mobile/domain/services/login.service.dart';
import 'package:immich_mobile/domain/services/server_info.service.dart';
import 'package:immich_mobile/domain/services/sync.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/presentation/modules/common/states/current_user.state.dart';
import 'package:immich_mobile/presentation/modules/common/states/server_info/server_feature_config.state.dart';
import 'package:immich_mobile/presentation/modules/theme/states/app_theme.state.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:immich_mobile/utils/immich_api_client.dart';

final di = GetIt.I;

class ServiceLocator {
  const ServiceLocator._internal();

  static void configureServices() {
    di.registerSingleton<DriftDatabaseRepository>(DriftDatabaseRepository());
    _registerRepositories();
    _registerPreGlobalStates();
  }

  static void configureServicesForIsolate({
    required DriftDatabaseRepository database,
  }) {
    di.registerSingleton<DriftDatabaseRepository>(database);
    _registerRepositories();
  }

  static void _registerRepositories() {
    /// Repositories
    di.registerFactory<IStoreRepository>(() => StoreDriftRepository(di()));
    di.registerFactory<ILogRepository>(() => LogDriftRepository(di()));
    di.registerFactory<AppSettingService>(() => AppSettingService(di()));
    di.registerFactory<IUserRepository>(() => UserDriftRepository(di()));
    di.registerFactory<IRemoteAssetRepository>(
      () => RemoteAssetDriftRepository(di()),
    );

    /// Services
    di.registerFactory<LoginService>(() => const LoginService());
  }

  static void _registerPreGlobalStates() {
    di.registerSingleton<AppRouter>(AppRouter());
    di.registerLazySingleton<AppThemeCubit>(() => AppThemeCubit(di()));
  }

  static void registerPostValidationServices(String endpoint) {
    di.registerSingleton<ImmichApiClient>(ImmichApiClient(endpoint: endpoint));
    di.registerFactory<UserService>(() => UserService(
          di<ImmichApiClient>().getUsersApi(),
        ));
    di.registerFactory<ServerInfoService>(() => ServerInfoService(
          di<ImmichApiClient>().getServerApi(),
        ));
    di.registerFactory<SyncService>(() => SyncService(di(), di()));
  }

  static void registerPostGlobalStates() {
    di.registerLazySingleton<ServerFeatureConfigCubit>(
      () => ServerFeatureConfigCubit(di()),
    );
  }

  static void registerCurrentUser(User user) {
    if (di.isRegistered<CurrentUserCubit>()) {
      di<CurrentUserCubit>().updateUser(user);
    } else {
      di.registerSingleton<CurrentUserCubit>(CurrentUserCubit(user));
    }
  }
}
