import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:pinput/pinput.dart';

class PinInput extends StatelessWidget {
  final Function(String)? onCompleted;
  final Function(String)? onChanged;
  final int? length;
  final bool? obscureText;
  final bool? autoFocus;
  final bool? hasError;
  final String? label;
  final TextEditingController? controller;

  const PinInput({
    super.key,
    this.onCompleted,
    this.onChanged,
    this.length,
    this.obscureText,
    this.autoFocus,
    this.hasError,
    this.label,
    this.controller,
  });

  @override
  Widget build(BuildContext context) {
    getPinSize() {
      final minimumPadding = 18.0;
      final gapWidth = 3.0;
      final screenWidth = context.width;
      final pinWidth =
          (screenWidth - (minimumPadding * 2) - (gapWidth * 5)) / (length ?? 6);

      if (pinWidth > 60) {
        return const Size(60, 64);
      }

      final pinHeight = pinWidth / (60 / 64);
      return Size(pinWidth, pinHeight);
    }

    final defaultPinTheme = PinTheme(
      width: getPinSize().width,
      height: getPinSize().height,
      textStyle: TextStyle(
        fontSize: 24,
        color: context.colorScheme.onSurface,
        fontFamily: 'Overpass Mono',
      ),
      decoration: BoxDecoration(
        borderRadius: const BorderRadius.all(Radius.circular(19)),
        border: Border.all(color: context.colorScheme.surfaceBright),
        color: context.colorScheme.surfaceContainerHigh,
      ),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(
            label!,
            style: context.textTheme.displayLarge
                ?.copyWith(color: context.colorScheme.onSurface.withAlpha(200)),
          ),
          const SizedBox(height: 4),
        ],
        Pinput(
          controller: controller,
          forceErrorState: hasError ?? false,
          autofocus: autoFocus ?? false,
          obscureText: obscureText ?? false,
          obscuringWidget: Icon(
            Icons.vpn_key_rounded,
            color: context.primaryColor,
            size: 20,
          ),
          separatorBuilder: (index) => const SizedBox(
            height: 64,
            width: 3,
          ),
          cursor: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Container(
                margin: const EdgeInsets.only(bottom: 9),
                width: 18,
                height: 2,
                color: context.primaryColor,
              ),
            ],
          ),
          defaultPinTheme: defaultPinTheme,
          focusedPinTheme: defaultPinTheme.copyWith(
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.all(Radius.circular(19)),
              border: Border.all(
                color: context.primaryColor.withValues(alpha: 0.5),
                width: 2,
              ),
              color: context.colorScheme.surfaceContainerHigh,
            ),
          ),
          errorPinTheme: defaultPinTheme.copyWith(
            decoration: BoxDecoration(
              color: context.colorScheme.error.withAlpha(15),
              borderRadius: const BorderRadius.all(Radius.circular(19)),
              border: Border.all(
                color: context.colorScheme.error.withAlpha(100),
                width: 2,
              ),
            ),
          ),
          pinputAutovalidateMode: PinputAutovalidateMode.onSubmit,
          length: length ?? 6,
          onChanged: onChanged,
          onCompleted: onCompleted,
        ),
      ],
    );
  }
}
