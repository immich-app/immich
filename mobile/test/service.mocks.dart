import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/services/network.service.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart';

class MockApiService extends Mock implements ApiService {}

class MockNetworkService extends Mock implements NetworkService {}

class MockSearchApi extends Mock implements SearchApi {}

class MockAppSettingService extends Mock implements AppSettingsService {}
