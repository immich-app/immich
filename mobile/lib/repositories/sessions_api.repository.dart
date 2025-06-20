import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/sessions/session_create_response.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:openapi/api.dart';

final sessionsAPIRepositoryProvider = Provider(
  (ref) => SessionsAPIRepository(
    ref.watch(apiServiceProvider).sessionsApi,
  ),
);

class SessionsAPIRepository extends ApiRepository {
  final SessionsApi _api;

  SessionsAPIRepository(this._api);

  Future<SessionCreateResponse> createSession(
    String deviceType,
    String deviceOS, {
    int? duration,
  }) async {
    final dto = await checkNull(
      _api.createSession(
        SessionCreateDto(
          deviceType: deviceType,
          deviceOS: deviceOS,
          duration: duration,
        ),
      ),
    );

    return SessionCreateResponse(
      id: dto.id,
      current: dto.current,
      deviceType: deviceType,
      deviceOS: deviceOS,
      expiresAt: dto.expiresAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      token: dto.token,
    );
  }
}
