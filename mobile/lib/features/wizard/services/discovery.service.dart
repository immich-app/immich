import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:immich_mobile/hearth_config.dart';
import 'package:nsd/nsd.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'discovery.service.g.dart';

@riverpod
class HearthDiscovery extends _$HearthDiscovery {
  @override
  // build() must return the raw type (String?), not AsyncValue<String?>
  FutureOr<String?> build() {
    return null;
  }

  /// The Immich Core API is strictly isolated on port 2283 on the appliance,
  /// even when mDNS advertises a different port (e.g. the Next.js walled
  /// garden on port 80). Force the discovered host onto port 2283.
  String _forceHearthPort(String host) {
    return 'http://$host:${HearthConfig.defaultPort}';
  }

  Future<void> discoverServer() async {
    state = const AsyncValue.loading();

    // Completer short-circuits the 5s budget the instant a matching service
    // is found, so callers awaiting discoverServer() resume immediately
    // rather than waiting out the full timeout.
    final completer = Completer<String?>();
    Discovery? discovery;

    void resolve(String? url) {
      if (!completer.isCompleted) completer.complete(url);
    }

    try {
      discovery = await startDiscovery('_http._tcp');

      discovery.addServiceListener((service, status) {
        if (status != ServiceStatus.found) return;
        final name = service.name?.toLowerCase() ?? '';
        final type = service.type?.toLowerCase() ?? '';
        // Accept either the new "hearth-hub" broadcast or legacy "immich"
        // advertisements. Check both name and type fields, since some mDNS
        // stacks place the human-readable identifier in either slot.
        final matches =
            name.contains('hearth-hub') ||
            name.contains('hearth') ||
            name.contains('immich') ||
            type.contains('hearth') ||
            type.contains('immich');
        if (!matches) return;

        final host = service.host;
        if (host == null || host.isEmpty) return;

        // Aggressive short-circuit: resolve on the very first valid match.
        resolve(_forceHearthPort(host));
      });

      // Race the listener against a 5s ceiling so we never hang forever
      // when no appliance is on the network.
      final url = await completer.future.timeout(const Duration(seconds: 5), onTimeout: () => null);

      state = AsyncValue.data(url);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    } finally {
      final d = discovery;
      if (d != null) {
        try {
          await stopDiscovery(d);
        } catch (_) {
          // best-effort teardown
        }
      }
    }
  }
}
