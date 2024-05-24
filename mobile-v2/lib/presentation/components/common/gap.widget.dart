import 'package:flutter/material.dart';
import 'package:immich_mobile/utils/constants/size_constants.dart';

@immutable
class SizedGap extends SizedBox {
  const SizedGap({super.key, super.height, super.width});

  // Widgets to be used in Column
  const SizedGap.sh({super.key}) : super(height: SizeConstants.s);
  const SizedGap.mh({super.key}) : super(height: SizeConstants.m);
  const SizedGap.lh({super.key}) : super(height: SizeConstants.l);
  const SizedGap.xlh({super.key}) : super(height: SizeConstants.xl);

  // Widgets to be used in Row
  const SizedGap.sw({super.key}) : super(width: SizeConstants.s);
  const SizedGap.mw({super.key}) : super(width: SizeConstants.m);
  const SizedGap.lw({super.key}) : super(width: SizeConstants.l);
  const SizedGap.xlw({super.key}) : super(width: SizeConstants.xl);
}
