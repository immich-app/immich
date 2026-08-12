import 'package:immich_mobile/constants/enums.dart';

class TrashSyncConfig {
  final TrashSyncMode mode;

  const TrashSyncConfig({this.mode = TrashSyncMode.off});

  TrashSyncConfig copyWith({TrashSyncMode? mode}) => TrashSyncConfig(mode: mode ?? this.mode);

  @override
  bool operator ==(Object other) => identical(this, other) || other is TrashSyncConfig && other.mode == mode;

  @override
  int get hashCode => mode.hashCode;
}
