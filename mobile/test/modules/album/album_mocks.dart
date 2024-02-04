import 'package:immich_mobile/modules/album/models/album.model.dart';
import 'package:immich_mobile/modules/album/providers/current_album.provider.dart';
import 'package:mocktail/mocktail.dart';

class MockCurrentAlbumProvider extends CurrentAlbum
    with Mock
    implements CurrentAlbumInternal {
  RemoteAlbum? initAlbum;
  MockCurrentAlbumProvider([this.initAlbum]);

  @override
  RemoteAlbum? build() {
    return initAlbum;
  }
}
