import 'dart:async';
import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:dio/dio.dart';
import 'package:get_it/get_it.dart';
import 'package:immich_mobile/domain/interfaces/log.interface.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/domain/repositories/log.repository.dart';
import 'package:immich_mobile/domain/repositories/store.repository.dart';
import 'package:immich_mobile/domain/repositories/user.repository.dart';
import 'package:immich_mobile/domain/services/app_setting.service.dart';
import 'package:immich_mobile/domain/services/login.service.dart';
import 'package:immich_mobile/domain/services/server_info.service.dart';
import 'package:immich_mobile/presentation/modules/common/states/current_user.state.dart';
import 'package:immich_mobile/presentation/modules/common/states/server_info/server_feature_config.state.dart';
import 'package:immich_mobile/presentation/modules/theme/states/app_theme.state.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:immich_mobile/utils/immich_auth_interceptor.dart';
import 'package:openapi/openapi.dart';

final di = GetIt.I;

class ServiceLocator {
  const ServiceLocator._internal();

  static void configureServices() {
    // Register DB
    di.registerSingleton<DriftDatabaseRepository>(DriftDatabaseRepository());
    _registerPreValidationServices();
  }

  static void _registerPreValidationServices() {
    // ====== DOMAIN

    // Init store
    di.registerFactory<IStoreRepository>(() => StoreDriftRepository(di()));
    // Logs
    di.registerFactory<ILogRepository>(() => LogDriftRepository(di()));
    // App Settings
    di.registerFactory<AppSettingService>(() => AppSettingService(di()));
    // User Repo
    di.registerFactory<IUserRepository>(() => UserDriftRepository(di()));
    // Login Service
    di.registerFactory<LoginService>(() => const LoginService());

    // ====== PRESENTATION

    // App router
    di.registerSingleton<AppRouter>(AppRouter());
    // Global states
    di.registerLazySingleton<AppThemeCubit>(() => AppThemeCubit(di()));
  }

  static FutureOr<void> registerPostValidationServices(String endpoint) async {
    if (di.isRegistered<Openapi>()) {
      return;
    }

    final deviceInfo = DeviceInfoPlugin();
    final String deviceModel;
    if (Platform.isIOS) {
      deviceModel = (await deviceInfo.iosInfo).utsname.machine;
    } else {
      deviceModel = (await deviceInfo.androidInfo).model;
    }

    // ====== DOMAIN

    di.registerSingleton<Openapi>(
      Openapi(
        dio: Dio(
          BaseOptions(
            baseUrl: endpoint,
            connectTimeout: const Duration(milliseconds: 5000),
            receiveTimeout: const Duration(milliseconds: 3000),
            headers: {
              'deviceModel': deviceModel,
              'deviceType': Platform.operatingSystem,
            },
          ),
        ),
        interceptors: [ImmichAuthInterceptor()],
      ),
    );
    di.registerFactory<ServerInfoService>(() => ServerInfoService(di()));

    // ====== PRESENTATION

    di.registerLazySingleton<ServerFeatureConfigCubit>(
      () => ServerFeatureConfigCubit(di()),
    );
  }

  static void registerCurrentUser(User user) {
    di.registerSingleton<CurrentUserCubit>(CurrentUserCubit(user));
  }
}
