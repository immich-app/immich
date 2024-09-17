import 'package:immich_mobile/interfaces/album.interface.dart';
import 'package:immich_mobile/interfaces/asset.interface.dart';
import 'package:immich_mobile/interfaces/backup.interface.dart';
import 'package:immich_mobile/interfaces/media.interface.dart';
import 'package:immich_mobile/interfaces/user.interface.dart';
import 'package:mocktail/mocktail.dart';

class MockAlbumRepository extends Mock implements IAlbumRepository {}

class MockAssetRepository extends Mock implements IAssetRepository {}

class MockUserRepository extends Mock implements IUserRepository {}

class MockBackupRepository extends Mock implements IBackupRepository {}

class MockMediaRepository extends Mock implements IMediaRepository {}
