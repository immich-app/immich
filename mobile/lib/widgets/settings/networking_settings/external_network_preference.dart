import 'dart:convert';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/auth/auxilary_endpoint.model.dart';
import 'package:immich_mobile/widgets/settings/networking_settings/endpoint_input.dart';

class ExternalNetworkPreference extends HookConsumerWidget {
  const ExternalNetworkPreference({super.key, required this.enabled});

  final bool enabled;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final entries =
        useState([AuxilaryEndpoint(url: '', status: AuxCheckStatus.unknown)]);
    final canSave = useState(false);

    saveEndpointList() {
      canSave.value =
          entries.value.every((e) => e.status == AuxCheckStatus.valid);

      final endpointList = entries.value
          .where((url) => url.status == AuxCheckStatus.valid)
          .toList();

      final jsonString = jsonEncode(endpointList);

      Store.put(
        StoreKey.externalEndpointList,
        jsonString,
      );
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
            shadowColor: context.colorScheme.primary.withValues(alpha: 0.2),
            child: child,
          );
        },
        child: child,
      );
    }

    useEffect(
      () {
        final jsonString = Store.tryGet(StoreKey.externalEndpointList);

        if (jsonString == null) {
          return null;
        }

        final List<dynamic> jsonList = jsonDecode(jsonString);
        entries.value =
            jsonList.map((e) => AuxilaryEndpoint.fromJson(e)).toList();
        return null;
      },
      const [],
    );

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          borderRadius: const BorderRadius.all(Radius.circular(16)),
          color: context.colorScheme.surfaceContainerLow,
          border: Border.all(
            color: context.colorScheme.surfaceContainerHighest,
            width: 1,
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              bottom: -36,
              right: -36,
              child: Icon(
                Icons.dns_rounded,
                size: 120,
                color: context.primaryColor.withValues(alpha: 0.05),
              ),
            ),
            ListView(
              padding: const EdgeInsets.symmetric(vertical: 16.0),
              physics: const ClampingScrollPhysics(),
              shrinkWrap: true,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(
                    vertical: 4.0,
                    horizontal: 24,
                  ),
                  child: Text(
                    "external_network_sheet_info".tr(),
                    style: context.textTheme.bodyMedium,
                  ),
                ),
                const SizedBox(height: 4),
                Divider(color: context.colorScheme.surfaceContainerHighest),
                Form(
                  key: GlobalKey<FormState>(),
                  child: ReorderableListView.builder(
                    buildDefaultDragHandles: false,
                    proxyDecorator: proxyDecorator,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: entries.value.length,
                    onReorder: handleReorder,
                    itemBuilder: (context, index) {
                      return EndpointInput(
                        key: Key(index.toString()),
                        index: index,
                        initialValue: entries.value[index],
                        onValidated: updateValidationStatus,
                        onDismissed: handleDismiss,
                        enabled: enabled,
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
                      icon: const Icon(Icons.add),
                      label: Text('add_endpoint'.tr().toUpperCase()),
                      onPressed: enabled
                          ? () {
                              entries.value = [
                                ...entries.value,
                                AuxilaryEndpoint(
                                  url: '',
                                  status: AuxCheckStatus.unknown,
                                ),
                              ];
                            }
                          : null,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
