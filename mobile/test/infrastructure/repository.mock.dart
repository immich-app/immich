import 'package:immich_mobile/domain/interfaces/log.interface.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/interfaces/user_api.repository.dart';
import 'package:mocktail/mocktail.dart';

class MockStoreRepository extends Mock implements IStoreRepository {}

class MockLogRepository extends Mock implements ILogRepository {}

class MockUserRepository extends Mock implements IUserRepository {}

// API Repos
class MockUserApiRepository extends Mock implements IUserApiRepository {}
