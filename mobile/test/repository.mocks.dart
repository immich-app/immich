import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/repositories/auth.repository.dart';
import 'package:immich_mobile/repositories/auth_api.repository.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:mocktail/mocktail.dart';

class MockAssetApiRepository extends Mock implements AssetApiRepository {}

class MockAssetMediaRepository extends Mock implements AssetMediaRepository {}

class MockAuthApiRepository extends Mock implements AuthApiRepository {}

class MockAuthRepository extends Mock implements AuthRepository {}

class MockLocalFilesManagerRepository extends Mock implements LocalFilesManagerRepository {}
