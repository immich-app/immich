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

    try {
      final discovery = await startDiscovery('_http._tcp');

      discovery.addServiceListener((service, status) {
        if (status == ServiceStatus.found) {
          final name = service.name?.toLowerCase() ?? '';
          if (name.contains('hearth') || name.contains('immich')) {
            final host = service.host;
            if (host != null && host.isNotEmpty) {
              stopDiscovery(discovery);
              state = AsyncValue.data(_forceHearthPort(host));
            }
          }
        }
      });

      await Future.delayed(const Duration(seconds: 5));
      if (state.isLoading) {
        stopDiscovery(discovery);
        state = const AsyncValue.data(null);
      }
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}
