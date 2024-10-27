import 'package:flutter/widgets.dart';
import 'package:immich_mobile/presentation/components/common/gap.widget.dart';
import 'package:immich_mobile/utils/constants/size_constants.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';

class ImPageEmptyIndicator extends StatelessWidget {
  final IconData icon;
  final String? message;
  final Widget? subtitle;

  const ImPageEmptyIndicator({
    super.key,
    required this.icon,
    this.message,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: SizeConstants.xl,
            color: context.colorScheme.primary,
          ),
          const SizedGap.mh(),
          if (message != null) Text(message!),
          if (subtitle != null) subtitle!,
        ],
      ),
    );
  }
}
