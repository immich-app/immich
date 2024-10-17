import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:immich_mobile/domain/models/server-info/server_feature_config.model.dart';
import 'package:immich_mobile/domain/services/server_info.service.dart';

class ServerFeatureConfigCubit extends Cubit<ServerFeatureConfig> {
  final ServerInfoService _serverInfoService;

  ServerFeatureConfigCubit(this._serverInfoService)
      : super(const ServerFeatureConfig.reset());

  Future<void> getFeatures() async =>
      await Future.wait([_getFeatures(), _getConfig()]);

  Future<void> _getFeatures() async {
    final features = await _serverInfoService.getServerFeatures();
    if (features != null) {
      emit(state.copyWith(features: features));
    }
  }

  Future<void> _getConfig() async {
    final config = await _serverInfoService.getServerConfig();
    if (config != null) {
      emit(state.copyWith(config: config));
    }
  }
}
