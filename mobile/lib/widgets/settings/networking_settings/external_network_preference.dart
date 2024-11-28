import 'dart:convert';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/auth/auxilary_endpoint.model.dart';
import 'package:immich_mobile/entities/store.entity.dart' as db_store;
import 'package:immich_mobile/widgets/settings/networking_settings/endpoint_input.dart';

class ExternalNetworkPreference extends HookConsumerWidget {
  const ExternalNetworkPreference({super.key, required this.enabled});

  final bool enabled;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final entries = useState([AuxilaryEndpoint('', AuxCheckStatus.unknown)]);
    final canSave =
        useState(entries.value.every((e) => e.status == AuxCheckStatus.valid));

    saveEndpointList() {
      canSave.value =
          entries.value.every((e) => e.status == AuxCheckStatus.valid);

      final endpointList = entries.value
          .where((url) => url.status == AuxCheckStatus.valid)
          .toList();

      final jsonString = jsonEncode(endpointList);

      db_store.Store.put(
        db_store.StoreKey.endpointLists,
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
            shadowColor: context.colorScheme.primary.withOpacity(0.2),
            child: child,
          );
        },
        child: child,
      );
    }

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

    return Padding(
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
            if (!enabled)
              Positioned.fill(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 2.5, sigmaY: 2.5),
                    child: Container(
                      color: context.colorScheme.surface.withOpacity(0.5),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
