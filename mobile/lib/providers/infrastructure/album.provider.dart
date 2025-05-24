import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final localAlbumRepository = Provider<ILocalAlbumRepository>(
  (ref) => DriftLocalAlbumRepository(ref.watch(driftProvider)),
);
