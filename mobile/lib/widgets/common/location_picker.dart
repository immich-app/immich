import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

Future<LatLng?> showLocationPicker({required BuildContext context, LatLng? initialLatLng}) {
  return showDialog<LatLng?>(
    context: context,
    useRootNavigator: false,
    builder: (ctx) => _LocationPicker(initialLatLng: initialLatLng),
  );
}

class _LocationPicker extends HookWidget {
  final LatLng? initialLatLng;

  const _LocationPicker({this.initialLatLng});

  bool _validateLat(String value) {
    final l = double.tryParse(value);
    return l != null && l > -90 && l < 90;
  }

  bool _validateLong(String value) {
    final l = double.tryParse(value);
    return l != null && l > -180 && l < 180;
  }

  @override
  Widget build(BuildContext context) {
    final latitude = useState(initialLatLng?.latitude ?? 0.0);
    final longitude = useState(initialLatLng?.longitude ?? 0.0);
    final latlng = LatLng(latitude.value, longitude.value);
    final latitiudeFocusNode = useFocusNode();
    final longitudeFocusNode = useFocusNode();
    final latitudeController = useTextEditingController(text: latitude.value.toStringAsFixed(4));
    final longitudeController = useTextEditingController(text: longitude.value.toStringAsFixed(4));

    useEffect(() {
      latitudeController.text = latitude.value.toStringAsFixed(4);
      longitudeController.text = longitude.value.toStringAsFixed(4);
      return null;
    }, [latitude.value, longitude.value]);

    Future<void> onMapTap() async {
      final newLatLng = await context.pushRoute<LatLng?>(MapLocationPickerRoute(initialLatLng: latlng));
      if (newLatLng != null) {
        latitude.value = newLatLng.latitude;
        longitude.value = newLatLng.longitude;
      }
    }

    void onLatitudeUpdated(double value) {
      latitude.value = value;
      longitudeFocusNode.requestFocus();
    }

    void onLongitudeEditingCompleted(double value) {
      longitude.value = value;
      longitudeFocusNode.unfocus();
    }

    return AlertDialog(
      contentPadding: const EdgeInsets.all(30),
      alignment: Alignment.center,
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("edit_location_dialog_title", style: context.textTheme.titleMedium).tr(),
            Align(
              alignment: Alignment.center,
              child: TextButton.icon(
                icon: const Text("location_picker_choose_on_map").tr(),
                label: const Icon(Icons.map_outlined, size: 16),
                onPressed: onMapTap,
              ),
            ),
            const SizedBox(height: 12),
            _ManualPickerInput(
              controller: latitudeController,
              decorationText: "latitude",
              hintText: "location_picker_latitude_hint",
              errorText: "location_picker_latitude_error",
              focusNode: latitiudeFocusNode,
              validator: _validateLat,
              onUpdated: onLatitudeUpdated,
            ),
            const SizedBox(height: 24),
            _ManualPickerInput(
              controller: longitudeController,
              decorationText: "longitude",
              hintText: "location_picker_longitude_hint",
              errorText: "location_picker_longitude_error",
              focusNode: longitudeFocusNode,
              validator: _validateLong,
              onUpdated: onLongitudeEditingCompleted,
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => context.pop(),
          child: Text(
            "cancel",
            style: context.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: context.colorScheme.error,
            ),
          ).tr(),
        ),
        TextButton(
          onPressed: () => context.maybePop(latlng),
          child: Text(
            "action_common_update",
            style: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600, color: context.primaryColor),
          ).tr(),
        ),
      ],
    );
  }
}

class _ManualPickerInput extends HookWidget {
  final TextEditingController controller;
  final String decorationText;
  final String hintText;
  final String errorText;
  final FocusNode focusNode;
  final bool Function(String value) validator;
  final Function(double value) onUpdated;

  const _ManualPickerInput({
    required this.controller,
    required this.decorationText,
    required this.hintText,
    required this.errorText,
    required this.focusNode,
    required this.validator,
    required this.onUpdated,
  });
  @override
  Widget build(BuildContext context) {
    final isValid = useState(true);

    void onEditingComplete() {
      isValid.value = validator(controller.text);
      if (isValid.value) {
        onUpdated(controller.text.toDouble());
      }
    }

    return TextField(
      controller: controller,
      focusNode: focusNode,
      textInputAction: TextInputAction.done,
      autofocus: false,
      decoration: InputDecoration(
        labelText: decorationText.tr(),
        labelStyle: TextStyle(fontWeight: FontWeight.bold, color: context.primaryColor),
        floatingLabelBehavior: FloatingLabelBehavior.auto,
        border: const OutlineInputBorder(),
        hintText: hintText.tr(),
        hintStyle: const TextStyle(fontWeight: FontWeight.normal, fontSize: 14),
        errorText: isValid.value ? null : errorText.tr(),
      ),
      onEditingComplete: onEditingComplete,
      keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
      inputFormatters: [LengthLimitingTextInputFormatter(8)],
      onTapOutside: (_) => focusNode.unfocus(),
    );
  }
}
