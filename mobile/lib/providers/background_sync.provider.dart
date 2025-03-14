import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/utils/background_sync.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'background_sync.provider.g.dart';

@Riverpod(keepAlive: true)
BackgroundSyncManager backgroundSync(Ref _) =>
    BackgroundSyncManager(duration: kBackgroundSyncDuration);
