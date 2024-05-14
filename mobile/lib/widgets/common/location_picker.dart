import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:immich_mobile/widgets/map/map_thumbnail.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

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

    Future<void> onMapTap() async {
      final newLatLng = await context.pushRoute<LatLng?>(
        MapLocationPickerRoute(initialLatLng: latlng),
      );
      if (newLatLng != null) {
        latitude.value = newLatLng.latitude;
        longitude.value = newLatLng.longitude;
      }
    }

    return AlertDialog(
      contentPadding: const EdgeInsets.all(30),
      alignment: Alignment.center,
      content: SingleChildScrollView(
        child: pickerMode.value == _LocationPickerMode.map
            ? _MapPicker(
                key: ValueKey(latlng),
                latlng: latlng,
                onModeSwitch: () =>
                    pickerMode.value = _LocationPickerMode.manual,
                onMapTap: onMapTap,
              )
            : _ManualPicker(
                latlng: latlng,
                onModeSwitch: () => pickerMode.value = _LocationPickerMode.map,
                onLatUpdated: (value) => latitude.value = value,
                onLonUpdated: (value) => longitude.value = value,
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
          onPressed: () => context.maybePop(latlng),
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

class _ManualPickerInput extends HookWidget {
  final String initialValue;
  final String decorationText;
  final String hintText;
  final String errorText;
  final FocusNode focusNode;
  final bool Function(String value) validator;
  final Function(double value) onUpdated;

  const _ManualPickerInput({
    required this.initialValue,
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
    final controller = useTextEditingController(text: initialValue);

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
        labelStyle: TextStyle(
          fontWeight: FontWeight.bold,
          color: context.primaryColor,
        ),
        floatingLabelBehavior: FloatingLabelBehavior.auto,
        border: const OutlineInputBorder(),
        hintText: hintText.tr(),
        hintStyle: const TextStyle(fontWeight: FontWeight.normal, fontSize: 14),
        errorText: isValid.value ? null : errorText.tr(),
      ),
      onEditingComplete: onEditingComplete,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      inputFormatters: [LengthLimitingTextInputFormatter(8)],
      onTapOutside: (_) => focusNode.unfocus(),
    );
  }
}

class _ManualPicker extends HookWidget {
  final LatLng latlng;
  final Function() onModeSwitch;
  final Function(double) onLatUpdated;
  final Function(double) onLonUpdated;

  const _ManualPicker({
    required this.latlng,
    required this.onModeSwitch,
    required this.onLatUpdated,
    required this.onLonUpdated,
  });

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
    final latitiudeFocusNode = useFocusNode();
    final longitudeFocusNode = useFocusNode();

    void onLatitudeUpdated(double value) {
      onLatUpdated(value);
      longitudeFocusNode.requestFocus();
    }

    void onLongitudeEditingCompleted(double value) {
      onLonUpdated(value);
      longitudeFocusNode.unfocus();
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text(
          "edit_location_dialog_title",
          textAlign: TextAlign.center,
        ).tr(),
        const SizedBox(height: 12),
        TextButton.icon(
          icon: const Text("location_picker_choose_on_map").tr(),
          label: const Icon(Icons.map_outlined, size: 16),
          onPressed: onModeSwitch,
        ),
        const SizedBox(height: 12),
        _ManualPickerInput(
          initialValue: latlng.latitude.toStringAsFixed(4),
          decorationText: "location_picker_latitude",
          hintText: "location_picker_latitude_hint",
          errorText: "location_picker_latitude_error",
          focusNode: latitiudeFocusNode,
          validator: _validateLat,
          onUpdated: onLatitudeUpdated,
        ),
        const SizedBox(height: 24),
        _ManualPickerInput(
          initialValue: latlng.longitude.toStringAsFixed(4),
          decorationText: "location_picker_longitude",
          hintText: "location_picker_longitude_hint",
          errorText: "location_picker_longitude_error",
          focusNode: latitiudeFocusNode,
          validator: _validateLong,
          onUpdated: onLongitudeEditingCompleted,
        ),
      ],
    );
  }
}

class _MapPicker extends StatelessWidget {
  final LatLng latlng;
  final Function() onModeSwitch;
  final Function() onMapTap;

  const _MapPicker({
    required this.latlng,
    required this.onModeSwitch,
    required this.onMapTap,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text(
          "edit_location_dialog_title",
          textAlign: TextAlign.center,
        ).tr(),
        const SizedBox(height: 12),
        TextButton.icon(
          icon: Text(
            "${latlng.latitude.toStringAsFixed(4)}, ${latlng.longitude.toStringAsFixed(4)}",
          ),
          label: const Icon(Icons.edit_outlined, size: 16),
          onPressed: onModeSwitch,
        ),
        const SizedBox(height: 12),
        MapThumbnail(
          centre: latlng,
          height: 200,
          width: 200,
          zoom: 8,
          showMarkerPin: true,
          onTap: (_, __) => onMapTap(),
        ),
      ],
    );
  }
}
