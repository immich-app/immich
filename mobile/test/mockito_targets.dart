import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trashed_local_asset.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/repositories/partner_api.repository.dart';
import 'package:immich_mobile/services/gcast.service.dart';
import 'package:mockito/annotations.dart';
import 'package:native_video_player/native_video_player.dart';

@GenerateNiceMocks([
  MockSpec<AssetService>(),
  MockSpec<GCastService>(),
  MockSpec<LocalAlbumRepository>(),
  MockSpec<LocalAssetRepository>(),
  MockSpec<NativeVideoPlayerController>(),
  MockSpec<NativeSyncApi>(),
  MockSpec<PartnerApiRepository>(),
  MockSpec<TimelineService>(),
  MockSpec<TrashedLocalAssetRepository>(),
])
void main() {}
