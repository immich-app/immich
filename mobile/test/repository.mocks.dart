import 'package:immich_mobile/domain/interfaces/exif.interface.dart';
import 'package:immich_mobile/interfaces/album.interface.dart';
import 'package:immich_mobile/interfaces/album_api.interface.dart';
import 'package:immich_mobile/interfaces/album_media.interface.dart';
import 'package:immich_mobile/interfaces/asset.interface.dart';
import 'package:immich_mobile/interfaces/asset_media.interface.dart';
import 'package:immich_mobile/interfaces/auth.interface.dart';
import 'package:immich_mobile/interfaces/auth_api.interface.dart';
import 'package:immich_mobile/interfaces/backup_album.interface.dart';
import 'package:immich_mobile/interfaces/etag.interface.dart';
import 'package:immich_mobile/interfaces/file_media.interface.dart';
import 'package:immich_mobile/interfaces/partner_api.interface.dart';
import 'package:immich_mobile/interfaces/partner.interface.dart';
import 'package:mocktail/mocktail.dart';

class MockAlbumRepository extends Mock implements IAlbumRepository {}

class MockAssetRepository extends Mock implements IAssetRepository {}

class MockBackupRepository extends Mock implements IBackupAlbumRepository {}

class MockExifInfoRepository extends Mock implements IExifInfoRepository {}

class MockETagRepository extends Mock implements IETagRepository {}

class MockAlbumMediaRepository extends Mock implements IAlbumMediaRepository {}

class MockAssetMediaRepository extends Mock implements IAssetMediaRepository {}

class MockFileMediaRepository extends Mock implements IFileMediaRepository {}

class MockAlbumApiRepository extends Mock implements IAlbumApiRepository {}

class MockAuthApiRepository extends Mock implements IAuthApiRepository {}

class MockAuthRepository extends Mock implements IAuthRepository {}

class MockPartnerApiRepository extends Mock implements IPartnerApiRepository {}

class MockPartnerRepository extends Mock implements IPartnerRepository {}
