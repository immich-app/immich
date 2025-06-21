import 'package:immich_mobile/domain/interfaces/exif.interface.dart';
import 'package:immich_mobile/repositories/partner_api.repository.dart';
import 'package:immich_mobile/repositories/album_media.repository.dart';
import 'package:immich_mobile/repositories/album_api.repository.dart';
import 'package:immich_mobile/repositories/partner.repository.dart';
import 'package:immich_mobile/repositories/etag.repository.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:immich_mobile/repositories/file_media.repository.dart';
import 'package:immich_mobile/repositories/backup.repository.dart';
import 'package:immich_mobile/repositories/auth.repository.dart';
import 'package:immich_mobile/repositories/auth_api.repository.dart';
import 'package:immich_mobile/repositories/asset.repository.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/repositories/album.repository.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:mocktail/mocktail.dart';

class MockAlbumRepository extends Mock implements AlbumRepository {}

class MockAssetRepository extends Mock implements AssetRepository {}

class MockBackupRepository extends Mock implements BackupAlbumRepository {}

class MockExifInfoRepository extends Mock implements IExifInfoRepository {}

class MockETagRepository extends Mock implements ETagRepository {}

class MockAlbumMediaRepository extends Mock implements AlbumMediaRepository {}

class MockBackupAlbumRepository extends Mock implements BackupAlbumRepository {}

class MockAssetApiRepository extends Mock implements AssetApiRepository {}

class MockAssetMediaRepository extends Mock implements AssetMediaRepository {}

class MockFileMediaRepository extends Mock implements FileMediaRepository {}

class MockAlbumApiRepository extends Mock implements AlbumApiRepository {}

class MockAuthApiRepository extends Mock implements AuthApiRepository {}

class MockAuthRepository extends Mock implements AuthRepository {}

class MockPartnerRepository extends Mock implements PartnerRepository {}

class MockPartnerApiRepository extends Mock implements PartnerApiRepository {}

class MockLocalFilesManagerRepository extends Mock
    implements LocalFilesManagerRepository {}
