import 'package:immich_mobile/domain/interfaces/exif.interface.dart';
import 'package:immich_mobile/interfaces/album.interface.dart';
import 'package:immich_mobile/interfaces/asset.interface.dart';
import 'package:immich_mobile/interfaces/asset_api.interface.dart';
import 'package:immich_mobile/interfaces/asset_media.interface.dart';
import 'package:immich_mobile/interfaces/auth.interface.dart';
import 'package:immich_mobile/interfaces/auth_api.interface.dart';
<<<<<<< HEAD
import 'package:immich_mobile/interfaces/etag.interface.dart';
import 'package:immich_mobile/interfaces/file_media.interface.dart';
import 'package:immich_mobile/interfaces/local_files_manager.interface.dart';
import 'package:immich_mobile/interfaces/partner.interface.dart';
import 'package:immich_mobile/interfaces/partner_api.interface.dart';
import 'package:immich_mobile/repositories/backup.repository.dart';
=======
import 'package:immich_mobile/interfaces/backup_album.interface.dart';
import 'package:immich_mobile/repositories/partner_api.repository.dart';
import 'package:immich_mobile/repositories/album_media.repository.dart';
import 'package:immich_mobile/repositories/album_api.repository.dart';
import 'package:immich_mobile/repositories/partner.repository.dart';
import 'package:immich_mobile/repositories/etag.repository.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:immich_mobile/repositories/file_media.repository.dart';
>>>>>>> 6a5597b36b97e3b7b9b1cd63e709b14a95092768
import 'package:mocktail/mocktail.dart';

class MockAlbumRepository extends Mock implements IAlbumRepository {}

class MockAssetRepository extends Mock implements IAssetRepository {}

class MockBackupRepository extends Mock implements BackupAlbumRepository {}

class MockExifInfoRepository extends Mock implements IExifInfoRepository {}

class MockETagRepository extends Mock implements ETagRepository {}

class MockAlbumMediaRepository extends Mock implements AlbumMediaRepository {}

class MockBackupAlbumRepository extends Mock implements BackupAlbumRepository {}

class MockAssetApiRepository extends Mock implements IAssetApiRepository {}

class MockAssetMediaRepository extends Mock implements IAssetMediaRepository {}

class MockFileMediaRepository extends Mock implements FileMediaRepository {}

class MockAlbumApiRepository extends Mock implements AlbumApiRepository {}

class MockAuthApiRepository extends Mock implements IAuthApiRepository {}

class MockAuthRepository extends Mock implements IAuthRepository {}

class MockPartnerRepository extends Mock implements PartnerRepository {}

class MockPartnerApiRepository extends Mock implements PartnerApiRepository {}

class MockLocalFilesManagerRepository extends Mock
    implements LocalFilesManagerRepository {}
