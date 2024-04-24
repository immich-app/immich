import 'package:get_it/get_it.dart';
import 'package:immich_mobile/domain/interfaces/log.interface.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/domain/repositories/log.repository.dart';
import 'package:immich_mobile/domain/repositories/store.repository.dart';
import 'package:immich_mobile/domain/store_manager.dart';

/// Ambient instance
final getIt = GetIt.instance;

class ServiceLocator {
  const ServiceLocator._internal();

  static void configureServices() {
    // Register DB
    getIt.registerSingleton<DriftDatabaseRepository>(DriftDatabaseRepository());
    _registerCoreServices();
  }

  static void _registerCoreServices() {
    // Init store
    getIt
        .registerFactory<IStoreRepository>(() => StoreDriftRepository(getIt()));
    getIt.registerSingleton<StoreManager>(StoreManager(getIt()));
    // Logs
    getIt.registerFactory<ILogRepository>(() => LogDriftRepository(getIt()));
  }
}
