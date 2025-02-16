import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:mocktail/mocktail.dart';

class MockUserRepository extends Mock implements IUserRepository {}

class MockStoreRepository extends Mock implements IStoreRepository {}
