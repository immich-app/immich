import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:mocktail/mocktail.dart' as mocktail;

import '../domain/service.mock.dart';
import '../infrastructure/repository.mock.dart';

class UnitMocks {
  final localAlbum = MockLocalAlbumRepository();
  final localAsset = MockDriftLocalAssetRepository();
  final trashedAsset = MockTrashedLocalAssetRepository();

  final nativeApi = MockNativeSyncApi();

  UnitMocks() {
    mocktail.registerFallbackValue(LocalAlbum(id: '', name: '', updatedAt: DateTime.now()));
    mocktail.registerFallbackValue(
      LocalAsset(
        id: '',
        name: '',
        type: AssetType.image,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        playbackStyle: AssetPlaybackStyle.image,
        isEdited: false,
      ),
    );
  }

  void reset() {
    mocktail.reset(localAlbum);
    mocktail.reset(localAsset);
    mocktail.reset(trashedAsset);
    mocktail.reset(nativeApi);
  }
}
