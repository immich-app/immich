import 'package:immich_mobile/models/sessions/session_create_response.model.dart';

abstract interface class ISessionAPIRepository {
  Future<SessionCreateResponse> createSession(
    String deviceName,
    String deviceOS, {
    int? duration,
  });
}
