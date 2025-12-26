import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/shared_link/shared_link.model.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/shared_link.provider.dart';
import 'package:immich_mobile/services/shared_link.service.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

@RoutePage()
class SharedLinkEditPage extends HookConsumerWidget {
  static const List<(Duration, String)> expiryPresetsWithLabels = [
    (Duration.zero, 'never'),
    (Duration(minutes: 30), 'shared_link_edit_expire_after_option_minutes'),
    (Duration(hours: 1), 'shared_link_edit_expire_after_option_hour'),
    (Duration(hours: 6), 'shared_link_edit_expire_after_option_hours'),
    (Duration(days: 1), 'shared_link_edit_expire_after_option_day'),
    (Duration(days: 7), 'shared_link_edit_expire_after_option_days'),
    (Duration(days: 30), 'shared_link_edit_expire_after_option_days'),
    (Duration(days: 90), 'shared_link_edit_expire_after_option_months'),
    (Duration(days: 365), 'shared_link_edit_expire_after_option_year'),
  ];
  static const int maxFutureDate = 365 * 2;

  final SharedLink? existingLink;
  final List<String>? assetsList;
  final String? albumId;

  const SharedLinkEditPage({super.key, this.existingLink, this.assetsList, this.albumId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeData = context.themeData;
    final colorScheme = context.colorScheme;
    final descriptionController = useTextEditingController(text: existingLink?.description ?? "");
    final descriptionFocusNode = useFocusNode();
    final passwordController = useTextEditingController(text: existingLink?.password ?? "");
    final slugController = useTextEditingController(text: existingLink?.slug ?? "");
    final slugFocusNode = useFocusNode();
    useListenable(slugController);
    final showMetadata = useState(existingLink?.showMetadata ?? true);
    final allowDownload = useState(existingLink?.allowDownload ?? true);
    final allowUpload = useState(existingLink?.allowUpload ?? false);
    final expiryAfter = useState<DateTime?>(existingLink?.expiresAt?.toLocal());
    final newShareLink = useState("");

    Widget buildSharedLinkRow({required String leading, required String content}) {
      return Row(
        children: [
          Expanded(
            child: Text(
              content,
              style: TextStyle(color: colorScheme.primary, fontWeight: FontWeight.bold),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          Text(leading, style: const TextStyle(fontWeight: FontWeight.bold)).tr(),
        ],
      );
    }

    Widget buildLinkTitle() {
      if (existingLink != null) {
        if (existingLink!.type == SharedLinkSource.album) {
          return buildSharedLinkRow(leading: 'public_album', content: existingLink!.title);
        }

        if (existingLink!.type == SharedLinkSource.individual) {
          return buildSharedLinkRow(
            leading: 'shared_link_individual_shared',
            content: existingLink!.description ?? "--",
          );
        }
      }

      return const Text("create_link_to_share_description", style: TextStyle(fontWeight: FontWeight.bold)).tr();
    }

    Widget buildDescriptionField() {
      return TextField(
        controller: descriptionController,
        focusNode: descriptionFocusNode,
        textInputAction: TextInputAction.done,
        autofocus: false,
        decoration: InputDecoration(
          labelText: 'description'.tr(),
          labelStyle: const TextStyle(fontWeight: FontWeight.bold),
          floatingLabelBehavior: FloatingLabelBehavior.always,
          border: const OutlineInputBorder(),
          hintText: 'shared_link_edit_description_hint'.tr(),
          hintStyle: const TextStyle(fontWeight: FontWeight.normal, fontSize: 14),
        ),
        onTapOutside: (_) => descriptionFocusNode.unfocus(),
      );
    }

    Widget buildPasswordField() {
      return TextField(
        controller: passwordController,
        autofocus: false,
        decoration: InputDecoration(
          labelText: 'password'.tr(),
          labelStyle: const TextStyle(fontWeight: FontWeight.bold),
          floatingLabelBehavior: FloatingLabelBehavior.always,
          border: const OutlineInputBorder(),
          hintText: 'shared_link_edit_password_hint'.tr(),
          hintStyle: const TextStyle(fontWeight: FontWeight.normal, fontSize: 14),
        ),
      );
    }

    Widget buildSlugField() {
      return TextField(
        controller: slugController,
        focusNode: slugFocusNode,
        textInputAction: TextInputAction.done,
        autofocus: false,
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        decoration: InputDecoration(
          hintText: 'custom_url'.tr(),
          labelText: slugController.text.isNotEmpty ? 'custom_url'.tr() : null,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold),
          border: const OutlineInputBorder(),
          prefixText: slugController.text.isNotEmpty ? '/s/' : null,
          prefixStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
        onTapOutside: (_) => slugFocusNode.unfocus(),
      );
    }

    String getShareLinkUrl(SharedLink link) {
      var serverUrl = getServerUrl();
      if (serverUrl != null && !serverUrl.endsWith('/')) serverUrl += '/';
      if (serverUrl == null) return '';

      final urlPath = link.slug?.isNotEmpty == true ? link.slug : link.key;
      return '${serverUrl}s/$urlPath';
    }

    Widget buildShowMetaButton() {
      return SwitchListTile.adaptive(
        value: showMetadata.value,
        onChanged: (value) => showMetadata.value = value,
        dense: true,
        title: Text("show_metadata", style: themeData.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.bold)).tr(),
      );
    }

    Widget buildAllowDownloadButton() {
      return SwitchListTile.adaptive(
        value: allowDownload.value,
        onChanged: (value) => allowDownload.value = value,
        dense: true,
        title: Text(
          "allow_public_user_to_download",
          style: themeData.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.bold),
        ).tr(),
      );
    }

    Widget buildAllowUploadButton() {
      return SwitchListTile.adaptive(
        value: allowUpload.value,
        onChanged: (value) => allowUpload.value = value,
        dense: true,
        title: Text(
          "allow_public_user_to_upload",
          style: themeData.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.bold),
        ).tr(),
      );
    }

    String formatDateTime(DateTime dateTime) => DateFormat.yMMMd(context.locale.toString()).add_Hm().format(dateTime);

    String getPresetLabel(String labelKey) => switch (labelKey) {
      'shared_link_edit_expire_after_option_minutes' => labelKey.tr(namedArgs: {'count': '30'}),
      'shared_link_edit_expire_after_option_hours' => labelKey.tr(namedArgs: {'count': '6'}),
      'shared_link_edit_expire_after_option_days' => labelKey.tr(namedArgs: {'count': '7'}),
      'shared_link_edit_expire_after_option_months' => labelKey.tr(namedArgs: {'count': '3'}),
      'shared_link_edit_expire_after_option_year' => labelKey.tr(namedArgs: {'count': '1'}),
      _ => labelKey.tr(),
    };

    DateTime? getExpiresAtFromPreset(Duration preset) => preset == Duration.zero ? null : DateTime.now().add(preset);

    Future<void> selectDate() async {
      final today = DateTime.now();
      final safeInitialDate = expiryAfter.value ?? today.add(const Duration(days: 7));
      final initialDate = safeInitialDate.isBefore(today) ? today : safeInitialDate;

      final selectedDate = await showDatePicker(
        context: context,
        initialDate: initialDate,
        firstDate: today,
        lastDate: today.add(const Duration(days: maxFutureDate)),
      );

      if (selectedDate != null && context.mounted) {
        final isToday =
            selectedDate.year == today.year && selectedDate.month == today.month && selectedDate.day == today.day;
        final initialTime = isToday ? TimeOfDay.fromDateTime(today) : const TimeOfDay(hour: 12, minute: 0);

        final selectedTime = await showTimePicker(context: context, initialTime: initialTime);

        if (selectedTime != null) {
          final now = DateTime.now();
          var finalDateTime = DateTime(
            selectedDate.year,
            selectedDate.month,
            selectedDate.day,
            selectedTime.hour,
            selectedTime.minute,
          );

          if (finalDateTime.isBefore(now) && isToday) finalDateTime = now;

          expiryAfter.value = finalDateTime;
        }
      }
    }

    Widget buildExpiryAfterButton() {
      return ExpansionTile(
        title: Text("expire_after", style: themeData.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.bold)).tr(),
        subtitle: Text(
          expiryAfter.value == null ? "shared_link_expires_never".tr() : formatDateTime(expiryAfter.value!),
          style: TextStyle(color: themeData.colorScheme.primary),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: expiryPresetsWithLabels
                      .map(
                        (preset) => ChoiceChip(
                          label: Text(getPresetLabel(preset.$2)),
                          selected: expiryAfter.value == getExpiresAtFromPreset(preset.$1),
                          onSelected: (_) => expiryAfter.value = getExpiresAtFromPreset(preset.$1),
                        ),
                      )
                      .toList(),
                ),
                if (expiryAfter.value != null) ...[
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: selectDate,
                      icon: const Icon(Icons.edit_calendar),
                      label: const Text('edit_date_and_time').tr(),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      );
    }

    void copyToClipboard(String link) {
      Clipboard.setData(ClipboardData(text: link)).then(
        (_) => context.scaffoldMessenger.showSnackBar(
          SnackBar(
            content: Text(
              "shared_link_clipboard_copied_massage",
              style: context.textTheme.bodyLarge?.copyWith(color: context.primaryColor),
            ).tr(),
            duration: const Duration(seconds: 2),
          ),
        ),
      );
    }

    Widget buildLinkCopyField(String link) {
      return TextFormField(
        readOnly: true,
        initialValue: link,
        decoration: InputDecoration(
          border: const OutlineInputBorder(),
          enabledBorder: themeData.inputDecorationTheme.focusedBorder,
          suffixIcon: IconButton(onPressed: () => copyToClipboard(link), icon: const Icon(Icons.copy)),
        ),
      );
    }

    Widget buildNewLinkReadyScreen() {
      return Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add_link, size: 100, color: themeData.colorScheme.primary),
            const SizedBox(height: 20),
            buildLinkCopyField(newShareLink.value),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => context.maybePop(),
              child: const Text("done", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)).tr(),
            ),
          ],
        ),
      );
    }

    DateTime? calculateExpiry() => expiryAfter.value;

    Future<void> handleNewLink() async {
      final newLink = await ref
          .read(sharedLinkServiceProvider)
          .createSharedLink(
            albumId: albumId,
            assetIds: assetsList,
            showMeta: showMetadata.value,
            allowDownload: allowDownload.value,
            allowUpload: allowUpload.value,
            description: descriptionController.text.isEmpty ? null : descriptionController.text,
            password: passwordController.text.isEmpty ? null : passwordController.text,
            slug: slugController.text.isEmpty ? null : slugController.text,
            expiresAt: calculateExpiry()?.toUtc(),
          );
      ref.invalidate(sharedLinksStateProvider);

      await ref.read(serverInfoProvider.notifier).getServerConfig();
      final externalDomain = ref.read(serverInfoProvider.select((s) => s.serverConfig.externalDomain));

      var serverUrl = externalDomain.isNotEmpty ? externalDomain : getServerUrl();
      if (serverUrl != null && !serverUrl.endsWith('/')) serverUrl += '/';

      if (newLink != null && serverUrl != null) {
        final urlPath = newLink.slug?.isNotEmpty == true ? newLink.slug : newLink.key;
        newShareLink.value = "${serverUrl}s/$urlPath";
        copyToClipboard(newShareLink.value);
      } else if (newLink == null) {
        ImmichToast.show(
          context: context,
          gravity: ToastGravity.BOTTOM,
          toastType: ToastType.error,
          msg: 'shared_link_create_error'.tr(),
        );
      }
    }

    Future<void> handleEditLink() async {
      bool? download;
      bool? upload;
      bool? meta;
      String? desc;
      String? password;
      String? slug;
      DateTime? expiry;
      bool? changeExpiry;

      if (allowDownload.value != existingLink!.allowDownload) {
        download = allowDownload.value;
      }

      if (allowUpload.value != existingLink!.allowUpload) {
        upload = allowUpload.value;
      }

      if (showMetadata.value != existingLink!.showMetadata) {
        meta = showMetadata.value;
      }

      if (descriptionController.text != existingLink!.description) {
        desc = descriptionController.text;
      }

      if (passwordController.text != existingLink!.password) {
        password = passwordController.text;
      }

      if (slugController.text != (existingLink!.slug ?? "")) {
        slug = slugController.text.isEmpty ? null : slugController.text;
      }

      final newExpiry = expiryAfter.value;
      if (newExpiry != existingLink!.expiresAt) {
        expiry = newExpiry;
        changeExpiry = true;
      }

      await ref
          .read(sharedLinkServiceProvider)
          .updateSharedLink(
            existingLink!.id,
            showMeta: meta,
            allowDownload: download,
            allowUpload: upload,
            description: desc,
            password: password,
            slug: slug,
            expiresAt: expiry?.toUtc(),
            changeExpiry: changeExpiry,
          );
      ref.invalidate(sharedLinksStateProvider);
      await context.maybePop();
    }

    Future<void> handleDeleteLink() async {
      return showDialog(
        context: context,
        builder: (BuildContext context) => ConfirmDialog(
          title: "delete_shared_link_dialog_title",
          content: "confirm_delete_shared_link",
          onOk: () async {
            await ref.read(sharedLinkServiceProvider).deleteSharedLink(existingLink!.id);
            ref.invalidate(sharedLinksStateProvider);
            if (context.mounted) await context.maybePop();
          },
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(existingLink == null ? "create_link_to_share" : "edit_link").tr(),
        elevation: 0,
        leading: const CloseButton(),
        centerTitle: false,
      ),
      body: SafeArea(
        child: newShareLink.value.isEmpty
            ? Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: ListView(
                  children: [
                    const SizedBox(height: 20),
                    buildLinkTitle(),
                    if (existingLink != null)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          const SizedBox(height: 16),
                          buildLinkCopyField(getShareLinkUrl(existingLink!)),
                          const SizedBox(height: 24),
                          const Divider(),
                        ],
                      ),
                    const SizedBox(height: 24),
                    buildDescriptionField(),
                    const SizedBox(height: 16),
                    buildPasswordField(),
                    const SizedBox(height: 16),
                    buildSlugField(),
                    const SizedBox(height: 16),
                    buildShowMetaButton(),
                    const SizedBox(height: 16),
                    buildAllowDownloadButton(),
                    const SizedBox(height: 16),
                    buildAllowUploadButton(),
                    const SizedBox(height: 16),
                    buildExpiryAfterButton(),
                    const SizedBox(height: 24),
                    Align(
                      alignment: Alignment.centerRight,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        spacing: 8,
                        children: [
                          if (existingLink != null)
                            OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: themeData.colorScheme.error,
                                side: BorderSide(color: themeData.colorScheme.error),
                              ),
                              onPressed: handleDeleteLink,
                              icon: const Icon(Icons.delete_outline),
                              label: const Text(
                                "delete",
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                              ).tr(),
                            ),
                          ElevatedButton(
                            onPressed: existingLink != null ? handleEditLink : handleNewLink,
                            child: Text(
                              existingLink != null ? "shared_link_edit_submit_button" : "create_link",
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                            ).tr(),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              )
            : Center(child: buildNewLinkReadyScreen()),
      ),
    );
  }
}
