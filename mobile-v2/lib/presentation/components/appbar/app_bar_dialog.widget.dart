import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/services/login.service.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/presentation/components/common/user_avatar.widget.dart';
import 'package:immich_mobile/presentation/components/image/immich_logo.widget.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:immich_mobile/presentation/states/app_info.state.dart';
import 'package:immich_mobile/presentation/states/current_user.state.dart';
import 'package:immich_mobile/presentation/states/server_info.state.dart';
import 'package:immich_mobile/presentation/theme/app_typography.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/constants/size_constants.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';
import 'package:immich_mobile/utils/extensions/color.extension.dart';
import 'package:immich_mobile/utils/extensions/number.extension.dart';
import 'package:immich_mobile/utils/immich_api_client.dart';
import 'package:material_symbols_icons/material_symbols_icons.dart';
import 'package:url_launcher/url_launcher.dart';

part 'app_bar_dialog_actions.widget.dart';
part 'app_bar_dialog_server.widget.dart';
part 'app_bar_dialog_storage.widget.dart';
part 'app_bar_dialog_version.widget.dart';

class ImAppBarDialog extends StatelessWidget {
  const ImAppBarDialog({super.key});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: EdgeInsets.only(
        left: context.isTablet ? 100 : 15,
        top: context.isTablet ? 15 : 0,
        right: context.isTablet ? 100 : 15,
        bottom: context.isTablet ? 15 : 100,
      ),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(SizeConstants.xm)),
      ),
      alignment: Alignment.center,
      child: const Padding(
        padding: EdgeInsets.all(SizeConstants.xs),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: EdgeInsets.only(bottom: SizeConstants.xm),
                child: _DialogTitleSection(),
              ),
              _DialogProfileSection(),
              _DialogStorageSection(),
              _DialogServerSection(),
              _DialogVersionMessage(),
              Padding(
                padding: EdgeInsets.only(top: 3),
                child: _DialogActionLogs(),
              ),
              _DialogActionSettings(),
              _DialogActionSignOut(),
              _DialogFooter(),
            ],
          ),
        ),
      ),
    );
  }
}

class _DialogTitleSection extends StatelessWidget {
  const _DialogTitleSection();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(left: SizeConstants.xs, top: SizeConstants.xs),
      child: Stack(
        children: [
          Align(
            alignment: Alignment.topLeft,
            child: InkWell(
              onTap: () => unawaited(context.maybePop()),
              child: Icon(Symbols.close_rounded, size: SizeConstants.xm),
            ),
          ),
          Center(child: ImLogoText(fontSize: SizeConstants.m)),
        ],
      ),
    );
  }
}

class _DialogHighlightedSection extends StatelessWidget {
  final BorderRadiusGeometry? borderRadius;
  final Widget child;

  const _DialogHighlightedSection({this.borderRadius, required this.child});

  @override
  Widget build(BuildContext context) {
    // ignore: avoid-wrapping-in-padding
    return Padding(
      padding: EdgeInsets.only(bottom: 3),
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: SizeConstants.s),
        decoration: BoxDecoration(
          color: context.colorScheme.surface,
          borderRadius: borderRadius,
        ),
        child: child,
      ),
    );
  }
}

class _DialogProfileSection extends StatelessWidget {
  const _DialogProfileSection();

  @override
  Widget build(BuildContext context) {
    final user = di<CurrentUserProvider>().value;

    return _DialogHighlightedSection(
      borderRadius: const BorderRadius.only(
        topLeft: Radius.circular(SizeConstants.xxs),
        topRight: Radius.circular(SizeConstants.xxs),
      ),
      child: ListTile(
        leading: ImUserAvatar(user: user),
        title: Text(
          user.name,
          style: AppTypography.titleMedium.copyWith(
            color: context.colorScheme.primary,
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: Text(
          user.email,
          style: AppTypography.titleMedium.copyWith(
            color: context.colorScheme.onSurface.darken(
              amount: RatioConstants.oneThird,
            ),
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
        minLeadingWidth: SizeConstants.xl,
      ),
    );
  }
}

class _DialogFooter extends StatelessWidget {
  const _DialogFooter();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: SizeConstants.s),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          InkWell(
            onTap: () => unawaited(launchUrl(
              Uri.parse('https://immich.app'),
              mode: LaunchMode.externalApplication,
            )),
            child:
                Text(context.t.common.components.appbar.footer_documentation),
          ),
          const SizedBox(
            width: 20,
            child: Text("•", textAlign: TextAlign.center),
          ),
          InkWell(
            onTap: () => unawaited(launchUrl(
              Uri.parse('https://github.com/immich-app/immich'),
              mode: LaunchMode.externalApplication,
            )),
            child: Text(context.t.common.components.appbar.footer_github),
          ),
        ],
      ),
    );
  }
}
