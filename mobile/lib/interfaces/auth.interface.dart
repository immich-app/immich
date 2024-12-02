import 'package:immich_mobile/interfaces/database.interface.dart';
import 'package:immich_mobile/models/auth/auxilary_endpoint.model.dart';

abstract interface class IAuthRepository implements IDatabaseRepository {
  Future<void> clearLocalData();
  String getAccessToken();
  bool getEndpointSwitchingFeature();
  String? getPreferredWifiName();
  String? getLocalEndpoint();
  List<AuxilaryEndpoint> getExternalEndpointList();
}
