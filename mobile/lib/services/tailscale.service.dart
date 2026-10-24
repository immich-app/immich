import 'package:tailscale/tailscale.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';

class TailscaleService {
  final Tailscale tailscale = Tailscale.instance;

  TailscaleService._();

  static final TailscaleService _instance = TailscaleService._();
  static TailscaleService get instance => _instance;

  Future<void> init({
    required String stateDir,
    required String appId,
  }) async {
    await tailscale.init(
      stateDir: stateDir,
      appId: appId,
    );
  }

  Future<void> login({
    required String authKey,
    required String hostname,
  }) async {
    await tailscale.up(
      hostname: hostname,
      authKey: authKey,
    );
  }

  Future<void> logout() async {
    await tailscale.down();
  }

  Future<TailscaleStatus?> getStatus() async {
    final status = await tailscale.status();
    return status;
  }

  bool get isInitialized => tailscale.isInitialized;
}