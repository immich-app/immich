import 'package:flutter/material.dart';
import 'package:immich_mobile/hearth_config.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../models/wizard_state.dart';
import '../models/wizard_step.dart';
import '../services/discovery.service.dart';

part 'wizard_provider.g.dart';

@riverpod
class WizardLogic extends _$WizardLogic {
  @override
  WizardState build() {
    return const WizardState();
  }

  /// Normalizes a raw server URL string into the canonical Hearth Hub
  /// endpoint `http://<host>:2283`. The Immich Core API is strictly
  /// isolated on port 2283; any other port is rewritten.
  String normalizeServerUrl(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) {
      return HearthConfig.serverUrl;
    }

    final withScheme = trimmed.contains('://') ? trimmed : 'http://$trimmed';
    final uri = Uri.tryParse(withScheme);
    if (uri == null || uri.host.isEmpty) {
      return HearthConfig.serverUrl;
    }

    // Always force the Hearth port, regardless of what mDNS or the QR
    // payload claimed.
    final forced = Uri(
      scheme: uri.scheme.isEmpty ? 'http' : uri.scheme,
      host: uri.host,
      port: HearthConfig.defaultPort,
      path: uri.path,
    );
    return forced.toString();
  }

  void setServerUrl(String url) {
    state = state.copyWith(serverUrl: normalizeServerUrl(url), errorMessage: null);
  }

  void moveToStep(WizardStep step) {
    state = state.copyWith(step: step);
  }

  /// Triggers mDNS discovery on the local network with a 5s budget.
  /// On success, the discovered URL is normalized to :2283 and wired
  /// into the global Immich ApiService via [authProvider.validateServerUrl].
  Future<void> startDiscovery() async {
    if (state.discoveryStatus == WizardDiscoveryStatus.discovering) {
      return;
    }

    state = state.copyWith(isLoading: true, errorMessage: null, discoveryStatus: WizardDiscoveryStatus.discovering);
    debugPrint('[Wizard] startDiscovery: kicking off mDNS sweep');

    try {
      // Capture the URL from the method's return value directly. Reading
      // hearthDiscoveryProvider's AsyncValue.state here previously raced
      // with Riverpod's internal FutureHandler when the native nsd plugin
      // threw on a background thread, producing "Bad state: Future
      // already completed". The discovery service no longer mutates its
      // state at all - the URL is the contract.
      final discoveredUrl = await ref.read(hearthDiscoveryProvider.notifier).discoverServer();
      debugPrint('[Wizard] startDiscovery: mDNS resolved url="$discoveredUrl"');

      if (discoveredUrl == null || discoveredUrl.isEmpty) {
        state = state.copyWith(isLoading: false, discoveryStatus: WizardDiscoveryStatus.discoveryFailed);
        return;
      }

      // Auto-advance: connectToServer awaits validateServerUrl and, on
      // success, sets step=login + discoveryStatus=discovered, which the
      // WizardScreen ref.listen will pick up to swap views.
      await connectToServer(discoveredUrl, WizardDiscoveryStatus.discovered);
      debugPrint(
        '[Wizard] startDiscovery: connectToServer returned step=${state.step} status=${state.discoveryStatus}',
      );
    } catch (e, st) {
      debugPrint('[Wizard] startDiscovery FAILED: $e\n$st');
      state = state.copyWith(isLoading: false, discoveryStatus: WizardDiscoveryStatus.discoveryFailed);
    }
  }

  /// Normalizes the URL, pushes it into Immich's native ApiService via
  /// [AuthNotifier.validateServerUrl] (which writes to StoreKey.serverEndpoint
  /// so the rest of the app picks it up), and advances the wizard to the
  /// login step on success.
  Future<void> connectToServer(String rawUrl, [WizardDiscoveryStatus? discoveryStatusOnSuccess]) async {
    final normalizedUrl = normalizeServerUrl(rawUrl);
    debugPrint('[Wizard] connectToServer raw="$rawUrl" normalized="$normalizedUrl"');
    state = state.copyWith(serverUrl: normalizedUrl, isLoading: true, errorMessage: null);

    try {
      final resolved = await ref.read(authProvider.notifier).validateServerUrl(normalizedUrl);
      debugPrint('[Wizard] validateServerUrl resolved="$resolved"');
      state = state.copyWith(
        isLoading: false,
        isServerValidated: true,
        step: WizardStep.login,
        discoveryStatus: discoveryStatusOnSuccess ?? WizardDiscoveryStatus.discovered,
      );
    } catch (e, stack) {
      debugPrint('[Wizard] validateServerUrl FAILED for "$normalizedUrl": $e\n$stack');
      state = state.copyWith(
        isLoading: false,
        discoveryStatus: WizardDiscoveryStatus.discoveryFailed,
        errorMessage: 'Could not reach $normalizedUrl. ${e.toString()}',
      );
    }
  }

  Future<void> validateServer() async {
    final target = state.serverUrl.isEmpty ? HearthConfig.serverUrl : state.serverUrl;
    await connectToServer(target);
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      await Future.delayed(const Duration(seconds: 2));
      state = state.copyWith(isLoading: false);
      debugPrint("Login successful for $email");
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: "Invalid credentials. Please try again.");
    }
  }

  void reset() {
    state = const WizardState();
  }
}
