import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/models/auth/auxilary_endpoint.model.dart';
import 'package:immich_mobile/widgets/common/responsive_button.dart';
import 'package:immich_mobile/widgets/settings/core/setting_info.dart';
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
    return Column(
      children: [
        const SettingInfo(
          text: 'external_network_sheet_info',
        ),
        const SizedBox(height: 8),
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
        const SizedBox(height: 8),
        Center(
          child: ResponsiveButton(
            type: ButtonType.outlined,
            icon: const Icon(Icons.add, size: 18),
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
            style: OutlinedButton.styleFrom(
              textStyle: context.textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            child: Text('add_endpoint'.t(context: context).toUpperCase()),
          ),
        ),
      ],
    );
  }
}
