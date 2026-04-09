import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/services/network.service.dart';
import 'package:mocktail/mocktail.dart';

class MockApiService extends Mock implements ApiService {}

class MockNetworkService extends Mock implements NetworkService {}

class MockAppSettingService extends Mock implements AppSettingsService {}
