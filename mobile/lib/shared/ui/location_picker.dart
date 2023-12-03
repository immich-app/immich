import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_map/plugin_api.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:immich_mobile/modules/map/ui/map_thumbnail.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:latlong2/latlong.dart';

Future<LatLng?> showLocationPicker({
  required BuildContext context,
  LatLng? initialLatLng,
}) {
  return showDialog<LatLng?>(
    context: context,
    useRootNavigator: false,
    builder: (ctx) => _LocationPicker(
      initialLatLng: initialLatLng,
    ),
  );
}

enum _LocationPickerMode { map, manual }

bool _validateLat(String value) {
  final l = double.tryParse(value);
  return l != null && l > -90 && l < 90;
}

bool _validateLong(String value) {
  final l = double.tryParse(value);
  return l != null && l > -180 && l < 180;
}

class _LocationPicker extends HookWidget {
  final LatLng? initialLatLng;

  const _LocationPicker({
    this.initialLatLng,
  });

  @override
  Widget build(BuildContext context) {
    final latitude = useState(initialLatLng?.latitude ?? 0.0);
    final longitude = useState(initialLatLng?.longitude ?? 0.0);
    final latlng = LatLng(latitude.value, longitude.value);
    final pickerMode = useState(_LocationPickerMode.map);
    final latitudeController = useTextEditingController();
    final isValidLatitude = useState(true);
    final latitiudeFocusNode = useFocusNode();
    final longitudeController = useTextEditingController();
    final longitudeFocusNode = useFocusNode();
    final isValidLongitude = useState(true);

    void validateInputs() {
      isValidLatitude.value = _validateLat(latitudeController.text);
      if (isValidLatitude.value) {
        latitude.value = latitudeController.text.toDouble();
      }
      isValidLongitude.value = _validateLong(longitudeController.text);
      if (isValidLongitude.value) {
        longitude.value = longitudeController.text.toDouble();
      }
    }

    void validateAndPop() {
      if (pickerMode.value == _LocationPickerMode.manual) {
        validateInputs();
      }
      if (isValidLatitude.value && isValidLongitude.value) {
        return context.pop(latlng);
      }
    }

    List<Widget> buildMapPickerMode() {
      return [
        TextButton.icon(
          icon: Text(
            "${latitude.value.toStringAsFixed(4)}, ${longitude.value.toStringAsFixed(4)}",
          ),
          label: const Icon(Icons.edit_outlined, size: 16),
          onPressed: () {
            latitudeController.text = latitude.value.toStringAsFixed(4);
            longitudeController.text = longitude.value.toStringAsFixed(4);
            pickerMode.value = _LocationPickerMode.manual;
          },
        ),
        const SizedBox(
          height: 12,
        ),
        MapThumbnail(
          coords: latlng,
          height: 200,
          width: 200,
          zoom: 6,
          showAttribution: false,
          onTap: (p0, p1) async {
            final newLatLng = await context.autoPush<LatLng?>(
              MapLocationPickerRoute(initialLatLng: latlng),
            );
            if (newLatLng != null) {
              latitude.value = newLatLng.latitude;
              longitude.value = newLatLng.longitude;
            }
          },
          markers: [
            Marker(
              anchorPos: AnchorPos.align(AnchorAlign.top),
              point: LatLng(
                latitude.value,
                longitude.value,
              ),
              builder: (ctx) => const Image(
                image: AssetImage('assets/location-pin.png'),
              ),
            ),
          ],
        ),
      ];
    }

    List<Widget> buildManualPickerMode() {
      return [
        TextButton.icon(
          icon: const Text("location_picker_choose_on_map").tr(),
          label: const Icon(Icons.map_outlined, size: 16),
          onPressed: () {
            validateInputs();
            if (isValidLatitude.value && isValidLongitude.value) {
              pickerMode.value = _LocationPickerMode.map;
            }
          },
        ),
        const SizedBox(
          height: 12,
        ),
        TextField(
          controller: latitudeController,
          focusNode: latitiudeFocusNode,
          textInputAction: TextInputAction.done,
          autofocus: false,
          decoration: InputDecoration(
            labelText: 'location_picker_latitude'.tr(),
            labelStyle: TextStyle(
              fontWeight: FontWeight.bold,
              color: context.primaryColor,
            ),
            floatingLabelBehavior: FloatingLabelBehavior.auto,
            border: const OutlineInputBorder(),
            hintText: 'location_picker_latitude_hint'.tr(),
            hintStyle: const TextStyle(
              fontWeight: FontWeight.normal,
              fontSize: 14,
            ),
            errorText: isValidLatitude.value
                ? null
                : "location_picker_latitude_error".tr(),
          ),
          onEditingComplete: () {
            isValidLatitude.value = _validateLat(latitudeController.text);
            if (isValidLatitude.value) {
              latitude.value = latitudeController.text.toDouble();
              longitudeFocusNode.requestFocus();
            }
          },
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          inputFormatters: [LengthLimitingTextInputFormatter(8)],
          onTapOutside: (_) => latitiudeFocusNode.unfocus(),
        ),
        const SizedBox(
          height: 24,
        ),
        TextField(
          controller: longitudeController,
          focusNode: longitudeFocusNode,
          textInputAction: TextInputAction.done,
          autofocus: false,
          decoration: InputDecoration(
            labelText: 'location_picker_longitude'.tr(),
            labelStyle: TextStyle(
              fontWeight: FontWeight.bold,
              color: context.primaryColor,
            ),
            floatingLabelBehavior: FloatingLabelBehavior.auto,
            border: const OutlineInputBorder(),
            hintText: 'location_picker_longitude_hint'.tr(),
            hintStyle: const TextStyle(
              fontWeight: FontWeight.normal,
              fontSize: 14,
            ),
            errorText: isValidLongitude.value
                ? null
                : "location_picker_longitude_error".tr(),
          ),
          onEditingComplete: () {
            isValidLongitude.value = _validateLong(longitudeController.text);
            if (isValidLongitude.value) {
              longitude.value = longitudeController.text.toDouble();
              longitudeFocusNode.unfocus();
            }
          },
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          inputFormatters: [LengthLimitingTextInputFormatter(8)],
          onTapOutside: (_) => longitudeFocusNode.unfocus(),
        ),
      ];
    }

    return AlertDialog(
      contentPadding: const EdgeInsets.all(30),
      alignment: Alignment.center,
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              "edit_location_dialog_title",
              textAlign: TextAlign.center,
            ).tr(),
            const SizedBox(
              height: 12,
            ),
            if (pickerMode.value == _LocationPickerMode.manual)
              ...buildManualPickerMode(),
            if (pickerMode.value == _LocationPickerMode.map)
              ...buildMapPickerMode(),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => context.pop(),
          child: Text(
            "action_common_cancel",
            style: context.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: context.colorScheme.error,
            ),
          ).tr(),
        ),
        TextButton(
          onPressed: validateAndPop,
          child: Text(
            "action_common_update",
            style: context.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: context.primaryColor,
            ),
          ).tr(),
        ),
      ],
    );
  }
}
