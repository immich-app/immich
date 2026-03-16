import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/constants/adjustments.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/image_converter.dart';

@RoutePage()
class DriftAdjustImagePage extends HookWidget {
  final Image image;
  final BaseAsset asset;

  const DriftAdjustImagePage({super.key, required this.image, required this.asset});

  @override
  Widget build(BuildContext context) {
    final brightness = useState<double>(0);
    final contrast = useState<double>(0);
    final saturation = useState<double>(0);
    final warmth = useState<double>(0);
    final sharpness = useState<double>(0);
    final isAutoEnhance = useState<bool>(false);
    final activePreset = useState<String>('adjust_preset_original');

    AdjustValues currentValues() => AdjustValues(
      brightness: brightness.value,
      contrast: contrast.value,
      saturation: saturation.value,
      warmth: warmth.value,
      sharpness: sharpness.value,
    );

    ColorFilter currentFilter() => adjustValuesToColorFilter(currentValues());

    void clearPreset() {
      isAutoEnhance.value = false;
      activePreset.value = '';
    }

    void applyPreset(AdjustPreset preset) {
      brightness.value = preset.values.brightness;
      contrast.value = preset.values.contrast;
      saturation.value = preset.values.saturation;
      warmth.value = preset.values.warmth;
      sharpness.value = preset.values.sharpness;
      isAutoEnhance.value = false;
      activePreset.value = preset.labelKey;
    }

    void applyAutoEnhance() {
      brightness.value = autoEnhanceValues.brightness;
      contrast.value = autoEnhanceValues.contrast;
      saturation.value = autoEnhanceValues.saturation;
      warmth.value = autoEnhanceValues.warmth;
      sharpness.value = autoEnhanceValues.sharpness;
      isAutoEnhance.value = true;
      activePreset.value = '';
    }

    return Scaffold(
      appBar: AppBar(
        backgroundColor: context.scaffoldBackgroundColor,
        title: Text("adjust".tr()),
        leading: CloseButton(color: context.primaryColor),
        actions: [
          IconButton(
            icon: Icon(Icons.done_rounded, color: context.primaryColor, size: 24),
            onPressed: () async {
              if (!currentValues().hasChanges) {
                unawaited(context.maybePop());
                return;
              }
              final filteredImage = await applyColorFilterToImage(image, currentFilter());
              unawaited(context.pushRoute(DriftEditImageRoute(asset: asset, image: filteredImage, isEdited: true)));
            },
          ),
        ],
      ),
      backgroundColor: context.scaffoldBackgroundColor,
      body: Column(
        children: [
          Expanded(
            flex: 5,
            child: Center(
              child: ColorFiltered(colorFilter: currentFilter(), child: image),
            ),
          ),
          SizedBox(
            height: 110,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              itemCount: adjustPresets.length + 1,
              itemBuilder: (context, index) {
                if (index == 0) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    child: _PresetButton(
                      image: image,
                      label: "auto_enhance".tr(),
                      filter: adjustValuesToColorFilter(autoEnhanceValues),
                      isSelected: isAutoEnhance.value,
                      icon: Icons.auto_fix_high,
                      onTap: applyAutoEnhance,
                    ),
                  );
                }
                final preset = adjustPresets[index - 1];
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: _PresetButton(
                    image: image,
                    label: preset.labelKey.tr(),
                    filter: adjustValuesToColorFilter(preset.values),
                    isSelected: activePreset.value == preset.labelKey && !isAutoEnhance.value,
                    onTap: () => applyPreset(preset),
                  ),
                );
              },
            ),
          ),
          const Divider(height: 1),
          Expanded(
            flex: 4,
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              children: [
                _AdjustSlider(
                  label: "brightness".tr(),
                  value: brightness.value,
                  onChanged: (v) {
                    brightness.value = v;
                    clearPreset();
                  },
                ),
                _AdjustSlider(
                  label: "contrast".tr(),
                  value: contrast.value,
                  onChanged: (v) {
                    contrast.value = v;
                    clearPreset();
                  },
                ),
                _AdjustSlider(
                  label: "saturation".tr(),
                  value: saturation.value,
                  onChanged: (v) {
                    saturation.value = v;
                    clearPreset();
                  },
                ),
                _AdjustSlider(
                  label: "warmth".tr(),
                  value: warmth.value,
                  onChanged: (v) {
                    warmth.value = v;
                    clearPreset();
                  },
                ),
                _AdjustSlider(
                  label: "sharpness".tr(),
                  value: sharpness.value,
                  onChanged: (v) {
                    sharpness.value = v;
                    clearPreset();
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AdjustSlider extends StatelessWidget {
  final String label;
  final double value;
  final ValueChanged<double> onChanged;

  const _AdjustSlider({required this.label, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: context.textTheme.bodyMedium),
              Text(
                value.round().toString(),
                style: context.textTheme.bodySmall?.copyWith(color: value != 0 ? context.primaryColor : null),
              ),
            ],
          ),
          SliderTheme(
            data: SliderThemeData(
              trackHeight: 2,
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
              overlayShape: const RoundSliderOverlayShape(overlayRadius: 16),
              activeTrackColor: context.primaryColor,
              inactiveTrackColor: context.primaryColor.withValues(alpha: 0.2),
              thumbColor: context.primaryColor,
            ),
            child: Slider(min: -100, max: 100, value: value, onChanged: onChanged),
          ),
        ],
      ),
    );
  }
}

class _PresetButton extends StatelessWidget {
  final Image image;
  final String label;
  final ColorFilter filter;
  final bool isSelected;
  final IconData? icon;
  final VoidCallback onTap;

  const _PresetButton({
    required this.image,
    required this.label,
    required this.filter,
    required this.isSelected,
    required this.onTap,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.all(Radius.circular(10)),
              border: isSelected ? Border.all(color: context.primaryColor, width: 3) : null,
            ),
            child: ClipRRect(
              borderRadius: const BorderRadius.all(Radius.circular(10)),
              child: icon != null
                  ? ColorFiltered(
                      colorFilter: filter,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          FittedBox(fit: BoxFit.cover, child: image),
                          Center(child: Icon(icon, color: Colors.white, size: 28)),
                        ],
                      ),
                    )
                  : ColorFiltered(
                      colorFilter: filter,
                      child: FittedBox(fit: BoxFit.cover, child: image),
                    ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: context.textTheme.bodySmall?.copyWith(
            fontWeight: isSelected ? FontWeight.bold : null,
            color: isSelected ? context.primaryColor : null,
          ),
        ),
      ],
    );
  }
}
