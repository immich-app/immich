import 'package:immich_mobile/domain/services/partner.service.dart';
import 'package:immich_mobile/domain/utils/background_sync.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:mocktail/mocktail.dart';

class MockBackgroundSyncManager extends Mock implements BackgroundSyncManager {}

class MockNativeSyncApi extends Mock implements NativeSyncApi {}

class MockPartnerService extends Mock implements PartnerService {}
