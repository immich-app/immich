import 'package:flutter/material.dart';

class LargeLeadingTile extends StatelessWidget {
  const LargeLeadingTile({
    super.key,
    required this.leading,
    required this.onTap,
    required this.title,
    this.subtitle,
    this.leadingPadding = const EdgeInsets.symmetric(
      vertical: 8,
      horizontal: 16.0,
    ),
  });

  final Widget leading;
  final VoidCallback onTap;
  final Widget title;
  final Widget? subtitle;
  final EdgeInsetsGeometry leadingPadding;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Padding(
            padding: leadingPadding,
            child: leading,
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: MediaQuery.of(context).size.width * 0.6,
                child: title,
              ),
              subtitle ?? const SizedBox.shrink(),
            ],
          ),
        ],
      ),
    );
  }
}
