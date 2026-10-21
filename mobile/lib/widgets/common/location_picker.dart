import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/error_handler.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:openapi/api.dart';

Future<LatLng?> showLocationPicker({required BuildContext context, LatLng? initialLatLng}) {
  return showDialog<LatLng?>(
    context: context,
    useRootNavigator: false,
    builder: (ctx) => _LocationPicker(initialLatLng: initialLatLng),
  );
}

class _LocationPicker extends HookConsumerWidget {
  final LatLng? initialLatLng;

  const _LocationPicker({this.initialLatLng});

  double? _parseLat(String value) {
    final l = double.tryParse(value.replaceAll(',', '.'));
    return l != null && l > -90 && l < 90 ? l : null;
  }

  double? _parseLong(String value) {
    final l = double.tryParse(value.replaceAll(',', '.'));
    return l != null && l > -180 && l < 180 ? l : null;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final latitude = useState(initialLatLng?.latitude ?? 0.0);
    final longitude = useState(initialLatLng?.longitude ?? 0.0);
    final favoriteLocations = useState<List<FavoriteLocationResponseDto>>([]);
    final favoriteNameController = useTextEditingController();
    final favoriteName = useState('');
    final isLoadingFavorites = useState(true);
    final isSavingFavorite = useState(false);
    final latlng = LatLng(latitude.value, longitude.value);
    final isLatitudeValid = useState(true);
    final isLongitudeValid = useState(true);
    final latitiudeFocusNode = useFocusNode();
    final longitudeFocusNode = useFocusNode();
    final latitudeController = useTextEditingController(text: latitude.value.toStringAsFixed(4));
    final longitudeController = useTextEditingController(text: longitude.value.toStringAsFixed(4));

    Future<void> loadFavoriteLocations() async {
      try {
        favoriteLocations.value = await ref.read(apiServiceProvider).mapApi.getFavoriteLocations() ?? [];
      } catch (error, stack) {
        handleError(error, stack: stack, description: 'Unable to load favorite locations');
      } finally {
        isLoadingFavorites.value = false;
      }
    }

    useEffect(() {
      unawaited(loadFavoriteLocations());
      return null;
    }, const []);

    void selectFavorite(FavoriteLocationResponseDto favorite) {
      latitude.value = favorite.latitude;
      longitude.value = favorite.longitude;
      latitudeController.text = favorite.latitude.toStringAsFixed(4);
      longitudeController.text = favorite.longitude.toStringAsFixed(4);
    }

    Future<void> saveFavoriteLocation() async {
      final name = favoriteNameController.text.trim();
      if (name.isEmpty || isSavingFavorite.value) {
        return;
      }

      isSavingFavorite.value = true;
      try {
        final favorite = await ref
            .read(apiServiceProvider)
            .mapApi
            .createFavoriteLocation(
              FavoriteLocationCreateDto(name: name, latitude: latitude.value, longitude: longitude.value),
            );
        if (favorite != null) {
          favoriteLocations.value = [...favoriteLocations.value, favorite]..sort((a, b) => a.name.compareTo(b.name));
          favoriteNameController.clear();
          favoriteName.value = '';
        }
      } catch (error, stack) {
        handleError(error, stack: stack, description: 'Unable to save favorite location');
      } finally {
        isSavingFavorite.value = false;
      }
    }

    Future<void> deleteFavoriteLocation(String id) async {
      try {
        await ref.read(apiServiceProvider).mapApi.deleteFavoriteLocation(id);
        favoriteLocations.value = favoriteLocations.value.where((favorite) => favorite.id != id).toList();
      } catch (error, stack) {
        handleError(error, stack: stack, description: 'Unable to delete favorite location');
      }
    }

    Future<void> onMapTap() async {
      final newLatLng = await context.pushRoute<LatLng?>(MapLocationPickerRoute(initialLatLng: latlng));
      if (newLatLng != null) {
        latitude.value = newLatLng.latitude;
        longitude.value = newLatLng.longitude;
        latitudeController.text = newLatLng.latitude.toStringAsFixed(4);
        longitudeController.text = newLatLng.longitude.toStringAsFixed(4);
      }
    }

    void onLatitudeUpdated() {
      longitudeFocusNode.requestFocus();
    }

    void onLongitudeEditingCompleted() {
      longitudeFocusNode.unfocus();
    }

    Future<void> onUpdate() async {
      isLatitudeValid.value = _parseLat(latitudeController.text) != null;
      isLongitudeValid.value = _parseLong(longitudeController.text) != null;
      if (isLatitudeValid.value && isLongitudeValid.value) {
        await context.maybePop(LatLng(latitude.value, longitude.value));
      }
    }

    return AlertDialog(
      contentPadding: const EdgeInsets.all(30),
      alignment: Alignment.center,
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(context.t.edit_location_dialog_title, style: context.textTheme.titleMedium),
            Align(
              alignment: Alignment.center,
              child: TextButton.icon(
                icon: Text(context.t.location_picker_choose_on_map),
                label: const Icon(Icons.map_outlined, size: 16),
                onPressed: onMapTap,
              ),
            ),
            const SizedBox(height: 12),
            _ManualPickerInput(
              controller: latitudeController,
              decorationText: context.t.latitude,
              hintText: context.t.location_picker_latitude_hint,
              errorText: context.t.location_picker_latitude_error,
              focusNode: latitiudeFocusNode,
              coordinate: latitude,
              isValid: isLatitudeValid,
              parse: _parseLat,
              onUpdated: onLatitudeUpdated,
            ),
            const SizedBox(height: 24),
            _ManualPickerInput(
              controller: longitudeController,
              decorationText: context.t.longitude,
              hintText: context.t.location_picker_longitude_hint,
              errorText: context.t.location_picker_longitude_error,
              focusNode: longitudeFocusNode,
              coordinate: longitude,
              isValid: isLongitudeValid,
              parse: _parseLong,
              onUpdated: onLongitudeEditingCompleted,
            ),
            const SizedBox(height: 20),
            TextField(
              controller: favoriteNameController,
              onChanged: (value) => favoriteName.value = value,
              decoration: InputDecoration(
                labelText: context.t.favorite_location_name_placeholder,
                border: const OutlineInputBorder(),
              ),
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => saveFavoriteLocation(),
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: isSavingFavorite.value || favoriteName.value.trim().isEmpty ? null : saveFavoriteLocation,
                icon: isSavingFavorite.value
                    ? const SizedBox.square(dimension: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.bookmark_add_outlined),
                label: Text(context.t.save),
              ),
            ),
            const SizedBox(height: 12),
            Text(context.t.favorite_locations, style: context.textTheme.titleSmall),
            if (isLoadingFavorites.value)
              const Padding(
                padding: EdgeInsets.all(12),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (favoriteLocations.value.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(context.t.favorite_locations_not_found),
              )
            else
              ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 180),
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: favoriteLocations.value.length,
                  itemBuilder: (context, index) {
                    final favorite = favoriteLocations.value[index];
                    return ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      title: Text(favorite.name, maxLines: 1, overflow: TextOverflow.ellipsis),
                      onTap: () => selectFavorite(favorite),
                      trailing: IconButton(
                        tooltip: context.t.delete_favorite_location(name: favorite.name),
                        icon: const Icon(Icons.delete_outline),
                        onPressed: () => deleteFavoriteLocation(favorite.id),
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => ContextHelper(context).pop(),
          child: Text(
            context.t.cancel,
            style: context.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: context.colorScheme.error,
            ),
          ),
        ),
        TextButton(
          onPressed: onUpdate,
          child: Text(
            context.t.action_common_update,
            style: context.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600, color: context.primaryColor),
          ),
        ),
      ],
    );
  }
}

class _ManualPickerInput extends StatelessWidget {
  final TextEditingController controller;
  final String decorationText;
  final String hintText;
  final String errorText;
  final FocusNode focusNode;
  final ValueNotifier<double> coordinate;
  final ValueNotifier<bool> isValid;
  final double? Function(String value) parse;
  final VoidCallback onUpdated;

  const _ManualPickerInput({
    required this.controller,
    required this.decorationText,
    required this.hintText,
    required this.errorText,
    required this.focusNode,
    required this.coordinate,
    required this.isValid,
    required this.parse,
    required this.onUpdated,
  });
  @override
  Widget build(BuildContext context) {
    void onEditingComplete() {
      isValid.value = parse(controller.text) != null;
      if (isValid.value) {
        onUpdated();
      }
    }

    return TextField(
      controller: controller,
      focusNode: focusNode,
      textInputAction: TextInputAction.done,
      autofocus: false,
      decoration: InputDecoration(
        labelText: decorationText,
        labelStyle: TextStyle(fontWeight: FontWeight.bold, color: context.primaryColor),
        floatingLabelBehavior: FloatingLabelBehavior.auto,
        border: const OutlineInputBorder(),
        hintText: hintText,
        hintStyle: const TextStyle(fontWeight: FontWeight.normal, fontSize: 14),
        errorText: isValid.value ? null : errorText,
      ),
      onChanged: (text) => coordinate.value = parse(text) ?? coordinate.value,
      onEditingComplete: onEditingComplete,
      keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
      onTapOutside: (_) => focusNode.unfocus(),
    );
  }
}
