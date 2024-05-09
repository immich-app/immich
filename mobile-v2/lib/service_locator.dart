import 'package:immich_mobile/domain/interfaces/log.interface.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/domain/repositories/log.repository.dart';
import 'package:immich_mobile/domain/repositories/store.repository.dart';
import 'package:immich_mobile/domain/services/app_setting.service.dart';
import 'package:immich_mobile/domain/store_manager.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:immich_mobile/presentation/theme/states/app_theme.state.dart';
import 'package:watch_it/watch_it.dart';

class ServiceLocator {
  const ServiceLocator._internal();

  static void configureServices() {
    // Register DB
    di.registerSingleton<DriftDatabaseRepository>(DriftDatabaseRepository());
    _registerDomainServices();
    _registerPresentationService();
  }

  static void _registerDomainServices() {
    // Init store
    di.registerFactory<IStoreRepository>(() => StoreDriftRepository(di()));
    di.registerSingleton<StoreManager>(StoreManager(di()));
    // Logs
    di.registerFactory<ILogRepository>(() => LogDriftRepository(di()));
    // App Settings
    di.registerFactory<AppSettingsService>(() => AppSettingsService(di()));
  }

  static void _registerPresentationService() {
    // App router
    di.registerSingleton<AppRouter>(AppRouter());
    // Global states
    di.registerLazySingleton<AppThemeState>(
      () => AppThemeState(appSettings: di())..init(),
    );
  }
}
