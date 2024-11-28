// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
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

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'url': url,
      'status': status.toMap(),
    };
  }

  factory AuxilaryEndpoint.fromMap(Map<String, dynamic> map) {
    return AuxilaryEndpoint(
      map['url'] as String,
      AuxCheckStatus.fromMap(map['status'] as Map<String, dynamic>),
    );
  }

  String toJson() => json.encode(toMap());

  factory AuxilaryEndpoint.fromJson(String source) =>
      AuxilaryEndpoint.fromMap(json.decode(source) as Map<String, dynamic>);
}

class NetworkingSettings extends HookConsumerWidget {
  const NetworkingSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentEndpoint =
        db_store.Store.get(db_store.StoreKey.serverEndpoint);
    final featureEnabled =
        useAppSettingsState(AppSettingsEnum.autoEndpointSwitching);
    final entries = useState<List<AuxilaryEndpoint>>(
      [
        AuxilaryEndpoint('', AuxCheckStatus.unknown),
      ],
    );

    useEffect(
      () {
        final jsonString =
            db_store.Store.tryGet(db_store.StoreKey.endpointLists);

        if (jsonString == null) {
          return null;
        }

        final List<dynamic> jsonList = jsonDecode(jsonString);
        entries.value =
            jsonList.map((e) => AuxilaryEndpoint.fromJson(e)).toList();
        return null;
      },
      [],
    );

    final canSave =
        useState(entries.value.every((e) => e.status == AuxCheckStatus.valid));

    saveEndpointList() {
      canSave.value =
          entries.value.every((e) => e.status == AuxCheckStatus.valid);

      final endpointList = entries.value
          .where((url) => url.status == AuxCheckStatus.valid)
          .toList();

      if (endpointList.length == 1) {
        db_store.Store.delete(db_store.StoreKey.endpointLists);
        return;
      }

      final jsonString = jsonEncode(endpointList);

      db_store.Store.put(
        db_store.StoreKey.endpointLists,
        jsonString,
      );
    }

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

      saveEndpointList();
    }

    handleReorder(int oldIndex, int newIndex) {
      if (oldIndex < newIndex) {
        newIndex -= 1;
      }

      final entry = entries.value.removeAt(oldIndex);
      entries.value.insert(newIndex, entry);
      entries.value = [...entries.value];

      saveEndpointList();
    }

    handleDismiss(int index) {
      entries.value = [...entries.value..removeAt(index)];

      saveEndpointList();
    }

    Widget proxyDecorator(
      Widget child,
      int index,
      Animation<double> animation,
    ) {
      return AnimatedBuilder(
        animation: animation,
        builder: (BuildContext context, Widget? child) {
          return Material(
            color: context.colorScheme.surfaceContainerHighest,
            shadowColor: context.colorScheme.primary.withOpacity(0.2),
            child: child,
          );
        },
        child: child,
      );
    }

    return ListView(
      padding: EdgeInsets.only(bottom: 96),
      physics: ClampingScrollPhysics(),
      children: [
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Card(
            child: ListTile(
              leading: Icon(Icons.check_circle_rounded, color: Colors.green),
              title: Text(
                "YOU ARE CONNECTING TO",
                style: context.textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
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
        Padding(
          padding: const EdgeInsets.only(top: 10.0),
          child: Divider(
            color: context.colorScheme.surfaceContainerHighest,
          ),
        ),
        SettingsSwitchListTile(
          enabled: true,
          valueNotifier: featureEnabled,
          title: "Automatic endpoint switching",
          subtitle:
              "Switch between endpoints automatically when on or off designated Wi-Fi networks",
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(
                Icons.home_outlined,
                color: context.colorScheme.onSurface.withAlpha(175),
              ),
              const SizedBox(width: 8),
              Text(
                "LOCAL NETWORK",
                style: context.textTheme.displaySmall?.copyWith(
                  color: context.colorScheme.onSurface.withAlpha(150),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Container(
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              color: context.colorScheme.surfaceContainerLow,
              border: Border.all(
                color: context.colorScheme.surfaceContainerHigh,
                width: 1,
              ),
            ),
            child: Stack(
              children: [
                ListView(
                  padding: EdgeInsets.symmetric(vertical: 16.0),
                  physics: ClampingScrollPhysics(),
                  shrinkWrap: true,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        vertical: 4.0,
                        horizontal: 24,
                      ),
                      child: Text(
                        "When connect to the following Wi-Fi network, the app will always prioritize connecting to the server at the following endpoint",
                        style: context.textTheme.bodyMedium,
                      ),
                    ),
                    SizedBox(height: 4),
                    Divider(
                      color: context.colorScheme.surfaceContainerHighest,
                    ),
                    ListTile(
                      contentPadding: EdgeInsets.only(left: 24, right: 8),
                      leading: Icon(Icons.wifi_rounded),
                      title: Text("WiFi Name"),
                      subtitle: Text("immich"),
                      trailing: IconButton(
                        onPressed: () {},
                        icon: Icon(Icons.edit_rounded),
                      ),
                    ),
                    ListTile(
                      contentPadding: EdgeInsets.only(left: 24, right: 8),
                      leading: Icon(Icons.lan_rounded),
                      title: Text("Server Endpoint"),
                      subtitle: Text("http://10.1.15.216:2283/api"),
                      trailing: IconButton(
                        onPressed: () {},
                        icon: Icon(Icons.edit_rounded),
                      ),
                    ),
                    SizedBox(height: 16),
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24.0,
                      ),
                      child: SizedBox(
                        height: 48,
                        child: OutlinedButton.icon(
                          icon: Icon(Icons.wifi_find_rounded),
                          label: Text('DISCOVER'),
                          onPressed: () {
                            checkNetwork();
                          },
                        ),
                      ),
                    ),
                  ],
                ),
                Positioned(
                  bottom: -36,
                  right: -36,
                  child: Icon(
                    Icons.home_outlined,
                    size: 120,
                    color: context.primaryColor.withOpacity(0.05),
                  ),
                ),
              ],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 32, left: 16, bottom: 16),
          child: Row(
            children: [
              Icon(
                Icons.dns_rounded,
                color: context.colorScheme.onSurface.withAlpha(150),
              ),
              const SizedBox(width: 8),
              Text(
                "EXTERNAL NETWORK",
                style: context.textTheme.displaySmall?.copyWith(
                  color: context.colorScheme.onSurface.withAlpha(175),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Container(
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              color: context.colorScheme.surfaceContainerLow,
              border: Border.all(
                color: context.colorScheme.surfaceContainerHighest,
                width: 1,
              ),
            ),
            child: Stack(
              children: [
                ListView(
                  padding: EdgeInsets.symmetric(vertical: 16.0),
                  physics: ClampingScrollPhysics(),
                  shrinkWrap: true,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        vertical: 4.0,
                        horizontal: 24,
                      ),
                      child: Text(
                        "When not connected to Wi-Fi, the app will attempt to connect to the following endpoints from top to bottom",
                        style: context.textTheme.bodyMedium,
                      ),
                    ),
                    SizedBox(height: 4),
                    Divider(color: context.colorScheme.surfaceContainerHighest),
                    Form(
                      key: GlobalKey<FormState>(),
                      child: ReorderableListView.builder(
                        buildDefaultDragHandles: false,
                        proxyDecorator: proxyDecorator,
                        shrinkWrap: true,
                        physics: NeverScrollableScrollPhysics(),
                        itemCount: entries.value.length,
                        onReorder: handleReorder,
                        itemBuilder: (context, index) {
                          return EndpointInput(
                            key: Key(index.toString()),
                            index: index,
                            initialValue: entries.value[index],
                            onValidated: updateValidationStatus,
                            onDismissed: handleDismiss,
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 24),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24.0),
                      child: SizedBox(
                        height: 48,
                        child: OutlinedButton.icon(
                          icon: Icon(Icons.add),
                          label: Text('ADD ENDPOINT'),
                          onPressed: () {
                            entries.value = [
                              ...entries.value,
                              AuxilaryEndpoint('', AuxCheckStatus.unknown),
                            ];
                          },
                        ),
                      ),
                    ),
                  ],
                ),
                Positioned(
                  bottom: -36,
                  right: -36,
                  child: Icon(
                    Icons.dns_rounded,
                    size: 120,
                    color: context.primaryColor.withOpacity(0.05),
                  ),
                ),
              ],
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
    required this.initialValue,
    required this.index,
    required this.onValidated,
    this.onDismissed,
  });

  final AuxilaryEndpoint initialValue;
  final int index;
  final Function(String url, int index, AuxCheckStatus status) onValidated;
  final Function(int index)? onDismissed;

  @override
  EndpointInputState createState() => EndpointInputState();
}

class EndpointInputState extends ConsumerState<EndpointInput> {
  late final TextEditingController controller;
  late final FocusNode focusNode;
  late AuxCheckStatus auxCheckStatus;
  bool isInputValid = false;
  bool enable = false;

  @override
  void initState() {
    super.initState();
    controller = TextEditingController(text: widget.initialValue.url);
    focusNode = FocusNode()..addListener(_onOutFocus);

    setState(() {
      auxCheckStatus = widget.initialValue.status;
      enable = controller.text !=
          db_store.Store.get(db_store.StoreKey.serverEndpoint);
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
    return Dismissible(
      key: ValueKey(widget.index.toString()),
      direction: (enable || widget.onDismissed != null)
          ? DismissDirection.endToStart
          : DismissDirection.none,
      onDismissed: (_) =>
          widget.onDismissed != null ? widget.onDismissed!(widget.index) : null,
      background: Container(
        color: Colors.red,
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 16),
        child: const Icon(
          Icons.delete,
          color: Colors.white,
        ),
      ),
      child: ListTile(
        contentPadding: EdgeInsets.only(left: 24, right: 24),
        trailing: ReorderableDragStartListener(
          index: widget.index,
          child: Icon(Icons.drag_handle_rounded),
        ),
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
            color: enable
                ? context.colorScheme.onSurface
                : context.colorScheme.onSurface.withOpacity(0.6),
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
            disabledBorder: OutlineInputBorder(
              borderSide: BorderSide(
                color:
                    context.isDarkTheme ? Colors.grey[900]! : Colors.grey[300]!,
              ),
              borderRadius: BorderRadius.all(Radius.circular(16)),
            ),
          ),
          controller: controller,
          focusNode: focusNode,
          enabled: enable,
        ),
      ),
    );
  }
}

class AuxCheckStatus {
  final String name;
  AuxCheckStatus({
    required this.name,
  });
  const AuxCheckStatus._(this.name);

  static const loading = AuxCheckStatus._('loading');
  static const valid = AuxCheckStatus._('valid');
  static const error = AuxCheckStatus._('error');
  static const unknown = AuxCheckStatus._('unknown');

  @override
  bool operator ==(covariant AuxCheckStatus other) {
    if (identical(this, other)) return true;

    return other.name == name;
  }

  @override
  int get hashCode => name.hashCode;

  AuxCheckStatus copyWith({
    String? name,
  }) {
    return AuxCheckStatus(
      name: name ?? this.name,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'name': name,
    };
  }

  factory AuxCheckStatus.fromMap(Map<String, dynamic> map) {
    return AuxCheckStatus(
      name: map['name'] as String,
    );
  }

  String toJson() => json.encode(toMap());

  factory AuxCheckStatus.fromJson(String source) =>
      AuxCheckStatus.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() => 'AuxCheckStatus(name: $name)';
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
