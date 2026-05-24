import 'dart:async';
import 'package:flutter/foundation.dart';
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

  /// "Indestructible" discovery: the resolved URL is hoarded into `foundUrl`
  /// in the outer scope so that ANY background exception thrown by the
  /// native nsd plugin (Bad-state-future, MulticastLock teardown, NsdError)
  /// cannot prevent us from returning the URL we already grabbed.
  ///
  /// Returns the URL directly. Does NOT touch `state` - callers must use
  /// the return value (see WizardLogic.startDiscovery).
  Future<String?> discoverServer() async {
    // Intentionally NO `state = ...` mutations inside this method. Setting
    // AsyncValue.data/error here while the Android nsd plugin is throwing
    // on a background thread causes Riverpod's FutureHandlerProviderElement
    // to assert "Bad state: Future already completed". We return the URL
    // directly to the caller instead.
    Discovery? discovery;
    String? foundUrl; // Hoist the result outside the try/catch.

    try {
      discovery = await startDiscovery('_http._tcp', ipLookupType: IpLookupType.v4);
      final completer = Completer<void>();

      discovery.addServiceListener((service, status) {
        // Trace every callback so we can see whether the scanner is hearing
        // anything at all. If this never prints, the native nsd layer never
        // armed (missing CHANGE_WIFI_MULTICAST_STATE, Wi-Fi off, etc.).
        debugPrint(
          '[mDNS] callback status=$status name=${service.name} type=${service.type} host=${service.host} addrs=${service.addresses}',
        );

        if (foundUrl != null) return; // already have a result, ignore everything else
        if (status != ServiceStatus.found) return;

        final name = service.name?.toLowerCase() ?? '';
        final type = service.type?.toLowerCase() ?? '';

        if (!name.contains('hearth-hub') &&
            !name.contains('hearth') &&
            !name.contains('immich') &&
            !type.contains('hearth-hub')) {
          return;
        }

        // Prefer a real, non-zero IPv4 from service.addresses.
        String? target;
        if (service.addresses != null) {
          for (final addr in service.addresses!) {
            if (addr.address.trim().isNotEmpty && addr.address != '0.0.0.0') {
              target = addr.address;
              break;
            }
          }
        }
        if (target == null || target.trim().isEmpty) target = service.host;
        if (target == null || target.trim().isEmpty) return;

        // Hoard the valid URL in the outer scope and signal the completer.
        foundUrl = _forceHearthPort(target);
        debugPrint('[mDNS] found valid target: $foundUrl');
        if (!completer.isCompleted) completer.complete();
      });

      await completer.future.timeout(
        const Duration(seconds: 5),
        onTimeout: () {
          debugPrint('[mDNS] 5s budget elapsed (foundUrl=$foundUrl)');
          if (!completer.isCompleted) completer.complete();
        },
      );

      return foundUrl;
    } catch (e, st) {
      // INDESTRUCTIBLE: even if the native nsd plugin throws in the
      // background AFTER we already snagged a valid URL, return what we
      // hoarded. Don't let Android wipe out a successful discovery.
      // We deliberately do NOT mutate `state` here - Riverpod's internal
      // FutureHandler asserts against concurrent mutations during async
      // throws on background threads.
      debugPrint('[mDNS] Android threw a background error: $e');
      if (foundUrl != null) {
        debugPrint('[mDNS] surviving the throw - returning hoarded url=$foundUrl');
      } else {
        debugPrint('[mDNS Scanner Crashed] no url to recover\nstack: $st');
      }
      return foundUrl;
    } finally {
      if (discovery != null) {
        try {
          await stopDiscovery(discovery);
        } catch (_) {
          // best-effort teardown - swallow NsdError, MulticastLock, etc.
        }
      }
    }
  }
}
