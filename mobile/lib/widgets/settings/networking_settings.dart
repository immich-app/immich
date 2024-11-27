// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:network_info_plus/network_info_plus.dart';
import 'package:permission_handler/permission_handler.dart';

import 'package:immich_mobile/entities/store.entity.dart' as db_store;
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/auth.provider.dart';

class AuxilaryEndpoint {
  final String url;
  final AuxCheckStatus status;

  AuxilaryEndpoint(
    this.url,
    this.status,
  );

  AuxilaryEndpoint copyWith({
    String? url,
    AuxCheckStatus? status,
  }) {
    return AuxilaryEndpoint(
      url ?? this.url,
      status ?? this.status,
    );
  }

  @override
  String toString() => 'AuxilaryEndpoint(url: $url, status: $status)';

  @override
  bool operator ==(covariant AuxilaryEndpoint other) {
    if (identical(this, other)) return true;

    return other.url == url && other.status == status;
  }

  @override
  int get hashCode => url.hashCode ^ status.hashCode;
}

class NetworkingSettings extends HookConsumerWidget {
  const NetworkingSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentEndpoint =
        db_store.Store.get(db_store.StoreKey.serverEndpoint);
    final entries = useState<List<AuxilaryEndpoint>>(
      [
        AuxilaryEndpoint(currentEndpoint, AuxCheckStatus.valid),
        AuxilaryEndpoint('', AuxCheckStatus.unknown),
      ],
    );

    final canSave =
        useState(entries.value.every((e) => e.status == AuxCheckStatus.valid));

    checkNetwork() async {
      final connectivityResult = await Connectivity().checkConnectivity();
      if (connectivityResult.contains(ConnectivityResult.wifi)) {
        // Get the current Wi-Fi network's SSID
        final ssid = NetworkInfo();
        print(await ssid.getWifiBSSID());
        print(await ssid.getWifiSubmask());
        print(await ssid.getWifiIP());
        print(await ssid.getWifiName());

        if (await Permission.locationWhenInUse.request().isGranted) {
          print("WIFI name");
          print(await ssid.getWifiName());
        } else {
          final perm = await Permission.locationWhenInUse.request();
          print("WIFI name unauthorized $perm");
        }
      } else {
        print('Device is not connected to Wi-Fi');
      }
    }

    updateValidationStatus(String url, int index, AuxCheckStatus status) {
      entries.value[index] =
          entries.value[index].copyWith(url: url, status: status);

      canSave.value =
          entries.value.every((e) => e.status == AuxCheckStatus.valid);
    }

    return ListView(
      children: [
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Card(
            child: ListTile(
              leading: Icon(Icons.check_circle_rounded, color: Colors.green),
              title: Text(
                "SERVER URL",
                style: context.textTheme.labelMedium,
              ),
              subtitle: Text(
                currentEndpoint,
                style: TextStyle(
                  fontSize: 16,
                  fontFamily: 'Inconsolata',
                  fontWeight: FontWeight.bold,
                  color: context.primaryColor,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            "The app will attempt to connect to the following endpoints, in descending order of priority.",
            style: context.textTheme.bodyMedium?.copyWith(
              color: context.colorScheme.onSurface.withOpacity(0.8),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Form(
          key: GlobalKey<FormState>(),
          child: ListView.builder(
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            itemCount: entries.value.length,
            itemBuilder: (context, index) {
              return EndpointInput(
                key: Key(index.toString()),
                endpoint: entries.value[index],
                onValidated: updateValidationStatus,
                index: index,
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: SizedBox(
            height: 48,
            child: OutlinedButton.icon(
              icon: Icon(Icons.add),
              label: Text('Add Endpoint'),
              onPressed: () {
                entries.value = [
                  ...entries.value,
                  AuxilaryEndpoint('', AuxCheckStatus.unknown),
                ];
              },
            ),
          ),
        ),
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: SizedBox(
            height: 48,
            child: ElevatedButton(
              onPressed: canSave.value ? checkNetwork : null,
              child: Text('Save'),
            ),
          ),
        ),
      ],
    );
  }
}

class EndpointInput extends StatefulHookConsumerWidget {
  const EndpointInput({
    super.key,
    required this.endpoint,
    required this.index,
    required this.onValidated,
  });

  final AuxilaryEndpoint endpoint;
  final int index;
  final Function(String url, int index, AuxCheckStatus status) onValidated;

  @override
  EndpointInputState createState() => EndpointInputState();
}

class EndpointInputState extends ConsumerState<EndpointInput> {
  late final TextEditingController controller;
  late final FocusNode focusNode;
  late AuxCheckStatus auxCheckStatus;
  bool isInputValid = false;

  @override
  void initState() {
    super.initState();
    controller = TextEditingController(text: widget.endpoint.url);
    focusNode = FocusNode()..addListener(_onOutFocus);

    setState(() {
      auxCheckStatus = widget.endpoint.status;
    });
  }

  @override
  void dispose() {
    focusNode.removeListener(_onOutFocus);
    focusNode.dispose();
    controller.dispose();
    super.dispose();
  }

  void _onOutFocus() {
    if (!focusNode.hasFocus && isInputValid) {
      validateAuxilaryServerUrl();
    } else if (!focusNode.hasFocus && !isInputValid) {
      setState(() => auxCheckStatus = AuxCheckStatus.unknown);
      widget.onValidated(controller.text, widget.index, auxCheckStatus);
    }
  }

  Future<void> validateAuxilaryServerUrl() async {
    final url = controller.text;
    setState(() => auxCheckStatus = AuxCheckStatus.loading);

    final isValid =
        await ref.read(authProvider.notifier).validateAuxilaryServerUrl(url);

    setState(() {
      auxCheckStatus = isValid ? AuxCheckStatus.valid : AuxCheckStatus.error;
    });

    widget.onValidated(url, widget.index, auxCheckStatus);
  }

  String? validateUrl(String? url) {
    try {
      if (url == null || url.isEmpty || !Uri.parse(url).isAbsolute) {
        isInputValid = false;
        return 'Please enter a valid URL';
      }
    } catch (_) {
      isInputValid = false;
      return 'Please enter a valid URL';
    }

    isInputValid = true;
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.only(left: 24, right: 24),
      leading: StatusIcon(
        key: ValueKey('status_$auxCheckStatus'),
        status: auxCheckStatus,
      ),
      subtitle: TextFormField(
        onTapOutside: (_) => focusNode.unfocus(),
        autovalidateMode: AutovalidateMode.onUserInteraction,
        validator: validateUrl,
        keyboardType: TextInputType.url,
        style: TextStyle(
          fontSize: 16,
          fontFamily: 'Inconsolata',
          fontWeight: FontWeight.w600,
          color: context.colorScheme.onSurface,
        ),
        decoration: InputDecoration(
          hintText: 'http(s)://immich.domain.com',
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 16.0,
          ),
          filled: true,
          fillColor: context.colorScheme.surfaceContainer,
          border: const OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(16)),
          ),
          errorBorder: OutlineInputBorder(
            borderSide: BorderSide(color: Colors.red[300]!),
            borderRadius: BorderRadius.all(Radius.circular(16)),
          ),
        ),
        controller: controller,
        focusNode: focusNode,
      ),
    );
  }
}

class AuxCheckStatus {
  final String name;
  const AuxCheckStatus._(this.name);

  static const loading = AuxCheckStatus._('loading');
  static const valid = AuxCheckStatus._('valid');
  static const error = AuxCheckStatus._('error');
  static const unknown = AuxCheckStatus._('unknown');

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is AuxCheckStatus && other.name == name;
  }

  @override
  int get hashCode => name.hashCode;
}

class StatusIcon extends StatelessWidget {
  const StatusIcon({
    super.key,
    required this.status,
  }) : super();

  final AuxCheckStatus status;

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 200),
      child: _buildIcon(context),
    );
  }

  Widget _buildIcon(BuildContext context) {
    switch (status) {
      case AuxCheckStatus.loading:
        return Padding(
          padding: const EdgeInsets.only(left: 4.0),
          child: SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              color: context.primaryColor,
              strokeWidth: 2,
              key: ValueKey('loading'),
            ),
          ),
        );
      case AuxCheckStatus.valid:
        return const Icon(
          Icons.check_circle_rounded,
          color: Colors.green,
          key: ValueKey('success'),
        );
      case AuxCheckStatus.error:
        return const Icon(
          Icons.error_rounded,
          color: Colors.red,
          key: ValueKey('error'),
        );
      default:
        return const Icon(Icons.circle_outlined, key: ValueKey('unknown'));
    }
  }
}
