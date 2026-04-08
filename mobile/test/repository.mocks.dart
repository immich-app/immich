import 'package:immich_mobile/repositories/album_api.repository.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/repositories/auth.repository.dart';
import 'package:immich_mobile/repositories/auth_api.repository.dart';
import 'package:immich_mobile/repositories/file_media.repository.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:immich_mobile/repositories/partner_api.repository.dart';
import 'package:mocktail/mocktail.dart';

class MockAssetApiRepository extends Mock implements AssetApiRepository {}

class MockAssetMediaRepository extends Mock implements AssetMediaRepository {}

class MockFileMediaRepository extends Mock implements FileMediaRepository {}

class MockAlbumApiRepository extends Mock implements AlbumApiRepository {}

class MockAuthApiRepository extends Mock implements AuthApiRepository {}

class MockAuthRepository extends Mock implements AuthRepository {}

class MockPartnerApiRepository extends Mock implements PartnerApiRepository {}

class MockLocalFilesManagerRepository extends Mock implements LocalFilesManagerRepository {}
