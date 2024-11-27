import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart' as db_store;
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:network_info_plus/network_info_plus.dart';
import 'package:permission_handler/permission_handler.dart';

class NetworkingSettings extends HookConsumerWidget {
  const NetworkingSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentEndpoint =
        db_store.Store.get(db_store.StoreKey.serverEndpoint);
    final entries = useState([currentEndpoint]);

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

    addEntry() {
      entries.value = [...entries.value, ''];
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
          // child: Column(
          //   children: List.generate(
          //     entries.value.length,
          //     (index) => EndpointInput(
          //       endpoint: entries.value[index],
          //       onDismissed: (index) => entries.value.removeAt(index),
          //       index: index,
          //     ),
          //   ),
          child: ListView.builder(
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            itemCount: entries.value.length,
            itemBuilder: (context, index) {
              return EndpointInput(
                key: Key(index.toString()),
                endpoint: entries.value[index],
                onDismissed: (index) => entries.value.removeAt(index),
                index: index,
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            children: [
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: addEntry,
                  icon: Icon(Icons.add),
                  label: Text('Add'),
                ),
              ),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: checkNetwork,
                  child: Text('Save'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class EndpointInput extends HookConsumerWidget {
  const EndpointInput({
    super.key,
    required this.endpoint,
    required this.index,
    required this.onDismissed,
  });

  final String endpoint;
  final int index;
  final Function(int index) onDismissed;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = useTextEditingController(text: endpoint);
    final focusNode = useFocusNode();
    final auxCheckStatus = useState<AuxCheckStatus>(AuxCheckStatus.unknown);

    validateAuxilaryServerUrl(String url) async {
      final isValid =
          await ref.watch(authProvider.notifier).validateAuxilaryServerUrl(url);
      if (isValid) {
        auxCheckStatus.value = AuxCheckStatus.success;
      } else {
        auxCheckStatus.value = AuxCheckStatus.error;
      }
    }

    onOutFocus() async {
      final url = controller.text;
      final inputValid = Uri.parse(url).isAbsolute;
      if (!focusNode.hasFocus && inputValid) {
        validateAuxilaryServerUrl(controller.text);
      }
    }

    useEffect(() {
      focusNode.addListener(onOutFocus);

      Future.microtask(() {
        if (controller.text.isNotEmpty &&
            Uri.parse(controller.text).isAbsolute) {
          validateAuxilaryServerUrl(controller.text);
        }
      });

      return () {
        focusNode.removeListener(onOutFocus);
      };
    });

    String? validateUrl(String? url) {
      if (url == null || url.isEmpty || !Uri.parse(url).isAbsolute) {
        return 'Please enter a valid URL';
      }

      return null;
    }

    return Dismissible(
      key: Key(index.toString()),
      onDismissed: (_) => onDismissed(index),
      direction: DismissDirection.endToStart,
      background: Container(
        color: Colors.red[300],
      ),
      child: ListTile(
        contentPadding: EdgeInsets.only(left: 24, right: 24),
        leading: StatusIcon(
          key: Key(index.toString() + auxCheckStatus.value.toString()),
          status: auxCheckStatus.value,
        ),
        subtitle: TextFormField(
          onTapOutside: (_) => focusNode.unfocus(),
          autovalidateMode: AutovalidateMode.always,
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
      ),
    );
  }
}

class StatusIcon extends StatelessWidget {
  const StatusIcon({
    super.key,
    required this.status,
  });

  final AuxCheckStatus status;

  @override
  Widget build(BuildContext context) {
    switch (status) {
      case AuxCheckStatus.loading:
        return Icon(Icons.circle_outlined);
      case AuxCheckStatus.success:
        return Icon(Icons.check_circle_rounded, color: Colors.green);
      case AuxCheckStatus.error:
        return Icon(Icons.error_rounded, color: Colors.red);
      default:
        return Icon(Icons.circle_outlined);
    }
  }
}

enum AuxCheckStatus {
  loading,
  success,
  error,
  unknown,
}
