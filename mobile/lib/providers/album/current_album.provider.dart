import 'package:immich_mobile/entities/album.entity.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'current_album.provider.g.dart';

@riverpod
class CurrentAlbum extends _$CurrentAlbum {
  @override
  Album? build() => null;

  void set(Album? a) => state = a;
}

/// Mock class for testing
abstract class CurrentAlbumInternal extends _$CurrentAlbum {}
