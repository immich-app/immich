import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/network.provider.dart';
import 'package:immich_mobile/utils/fade_on_tap.dart';
import 'package:immich_mobile/widgets/common/responsive_button.dart';
import 'package:immich_mobile/widgets/settings/core/setting_info.dart';

class LocalNetworkPreference extends HookConsumerWidget {
  const LocalNetworkPreference({
    super.key,
    required this.enabled,
  });

  final bool enabled;

  Future<String?> _showEditDialog(
    BuildContext context,
    String title,
    String hintText,
    String initialValue,
  ) {
    final controller = TextEditingController(text: initialValue);

    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: InputDecoration(
            border: const OutlineInputBorder(),
            hintText: hintText,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'cancel'.tr().toUpperCase(),
              style: const TextStyle(color: Colors.red),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: Text('save'.tr().toUpperCase()),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wifiNameText = useState("");
    final localEndpointText = useState("");

    useEffect(
      () {
        final wifiName = ref.read(authProvider.notifier).getSavedWifiName();
        final localEndpoint =
            ref.read(authProvider.notifier).getSavedLocalEndpoint();

        if (wifiName != null) {
          wifiNameText.value = wifiName;
        }

        if (localEndpoint != null) {
          localEndpointText.value = localEndpoint;
        }

        return null;
      },
      [],
    );

    saveWifiName(String wifiName) {
      wifiNameText.value = wifiName;
      return ref.read(authProvider.notifier).saveWifiName(wifiName);
    }

    saveLocalEndpoint(String url) {
      localEndpointText.value = url;
      return ref.read(authProvider.notifier).saveLocalEndpoint(url);
    }

    handleEditWifiName() async {
      final wifiName = await _showEditDialog(
        context,
        "wifi_name".tr(),
        "your_wifi_name".tr(),
        wifiNameText.value,
      );

      if (wifiName != null) {
        await saveWifiName(wifiName);
      }
    }

    handleEditServerEndpoint() async {
      final localEndpoint = await _showEditDialog(
        context,
        "server_endpoint".tr(),
        "http://local-ip:2283",
        localEndpointText.value,
      );

      if (localEndpoint != null) {
        await saveLocalEndpoint(localEndpoint);
      }
    }

    autofillCurrentNetwork() async {
      final wifiName = await ref.read(networkProvider.notifier).getWifiName();

      if (wifiName == null) {
        context.showSnackBar(
          SnackBar(
            content: Text(
              "get_wifiname_error".tr(),
              style: context.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
                color: context.colorScheme.onSecondary,
              ),
            ),
            backgroundColor: context.colorScheme.secondary,
          ),
        );
      } else {
        saveWifiName(wifiName);
      }

      final serverEndpoint =
          ref.read(authProvider.notifier).getServerEndpoint();

      if (serverEndpoint != null) {
        saveLocalEndpoint(serverEndpoint);
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SettingInfo(
          text: 'local_network_sheet_info',
        ),
        _NetworkSettingItem(
          icon: Icons.wifi_rounded,
          title: "wifi_name".tr(),
          subtitle: wifiNameText.value.isEmpty
              ? "enter_wifi_name".tr()
              : wifiNameText.value,
          isConfigured: wifiNameText.value.isNotEmpty,
          onTap: enabled ? handleEditWifiName : null,
          enabled: enabled,
        ),
        _NetworkSettingItem(
          icon: Icons.lan_rounded,
          title: "server_endpoint".tr(),
          subtitle: localEndpointText.value.isEmpty
              ? "http://local-ip:2283"
              : localEndpointText.value,
          isConfigured: localEndpointText.value.isNotEmpty,
          onTap: enabled ? handleEditServerEndpoint : null,
          enabled: enabled,
        ),
        const SizedBox(height: 8),
        Center(
          child: ResponsiveButton(
            type: ButtonType.outlined,
            icon: const Icon(Icons.wifi_find_rounded, size: 18),
            onPressed: enabled ? autofillCurrentNetwork : null,
            style: OutlinedButton.styleFrom(
              textStyle: context.textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            child: Text('use_current_connection'.tr().toUpperCase()),
          ),
        ),
      ],
    );
  }
}

class _NetworkSettingItem extends StatelessWidget {
  const _NetworkSettingItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.isConfigured,
    required this.onTap,
    required this.enabled,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final bool isConfigured;
  final VoidCallback? onTap;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return FadeOnTap(
      onTap: onTap,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 8),
        leading: Icon(
          icon,
          size: 20,
          color: enabled
              ? context.colorScheme.onSurface
              : context.themeData.disabledColor,
        ),
        title: Text(
          title,
          style: context.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w500,
            color: enabled
                ? context.colorScheme.onSurface
                : context.themeData.disabledColor,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: context.textTheme.bodySmall?.copyWith(
            fontFamily: isConfigured ? 'Inconsolata' : null,
            fontWeight: isConfigured ? FontWeight.w600 : FontWeight.normal,
            color: isConfigured && enabled
                ? context.colorScheme.primary
                : context.colorScheme.onSurfaceSecondary,
            height: 1.3,
          ),
        ),
        trailing: enabled
            ? Icon(
                Icons.edit_outlined,
                size: 18,
                color: context.colorScheme.onSurfaceSecondary,
              )
            : null,
      ),
    );
  }
}
