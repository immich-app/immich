import 'package:flutter/material.dart';
import 'package:immich_mobile/utils/constants/size_constants.dart';

@immutable
class SizedGap extends SizedBox {
  const SizedGap({super.key, super.height, super.width});

  // Widgets to be used in Column
  const SizedGap.sh({super.key}) : super(height: SizeConstants.s);
  const SizedGap.xsh({super.key}) : super(height: SizeConstants.xs);
  const SizedGap.xxsh({super.key}) : super(height: SizeConstants.xxs);
  const SizedGap.mh({super.key}) : super(height: SizeConstants.m);
  const SizedGap.xmh({super.key}) : super(height: SizeConstants.xm);
  const SizedGap.xxmh({super.key}) : super(height: SizeConstants.xxm);
  const SizedGap.lh({super.key}) : super(height: SizeConstants.l);
  const SizedGap.xlh({super.key}) : super(height: SizeConstants.xl);
  const SizedGap.xxlh({super.key}) : super(height: SizeConstants.xxl);

  // Widgets to be used in Row
  const SizedGap.sw({super.key}) : super(width: SizeConstants.s);
  const SizedGap.xsw({super.key}) : super(width: SizeConstants.xs);
  const SizedGap.xxsw({super.key}) : super(width: SizeConstants.xxs);
  const SizedGap.mw({super.key}) : super(width: SizeConstants.m);
  const SizedGap.xmw({super.key}) : super(width: SizeConstants.xm);
  const SizedGap.xxmw({super.key}) : super(width: SizeConstants.xxm);
  const SizedGap.lw({super.key}) : super(width: SizeConstants.l);
  const SizedGap.xlw({super.key}) : super(width: SizeConstants.xl);
  const SizedGap.xxlw({super.key}) : super(width: SizeConstants.xxl);
}
