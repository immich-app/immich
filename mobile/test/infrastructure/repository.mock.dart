import 'package:immich_mobile/domain/interfaces/log.interface.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:mocktail/mocktail.dart';

class MockStoreRepository extends Mock implements IStoreRepository {}

class MockLogRepository extends Mock implements ILogRepository {}
