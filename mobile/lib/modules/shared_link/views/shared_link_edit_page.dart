import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/shared_link/providers/shared_link.provider.dart';
import 'package:openapi/api.dart';

class SharedLinkEditPage extends HookConsumerWidget {
  final SharedLinkResponseDto? existingLink;
  final List<String>? assetsList;
  final String? albumId;

  const SharedLinkEditPage({
    super.key,
    this.existingLink,
    this.assetsList,
    this.albumId,
  });

  getAppBarTitle() {
    return existingLink == null ? "Create link to share" : "Edit link";
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeData = Theme.of(context);
    final descriptionController =
        useTextEditingController(text: existingLink?.description ?? "");
    final descriptionFocusNode = useFocusNode();
    final showMetadata = useState(existingLink?.showMetadata ?? true);
    final allowDownload = useState(existingLink?.allowDownload ?? true);
    final allowUpload = useState(existingLink?.allowUpload ?? false);
    final editExpiry = useState(false);
    final expiryAfter = useState(0);

    buildLinkTitle() {
      if (existingLink != null) {
        if (existingLink!.type == SharedLinkType.ALBUM) {
          return Row(
            children: [
              const Text(
                "Public album | ",
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              Text(
                existingLink!.album!.albumName,
                style: TextStyle(
                  color: themeData.primaryColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          );
        }

        if (existingLink!.type == SharedLinkType.INDIVIDUAL) {
          return Row(
            children: [
              const Text(
                "Individual shared | ",
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              Expanded(
                child: Text(
                  existingLink!.description ?? "",
                  style: TextStyle(
                    color: themeData.primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          );
        }
      }

      return const Text(
        "Let anyone with the link see the selected photo(s)",
        style: TextStyle(fontWeight: FontWeight.bold),
      );
    }

    buildDescriptionField() {
      return TextField(
        controller: descriptionController,
        focusNode: descriptionFocusNode,
        textInputAction: TextInputAction.done,
        autofocus: false,
        decoration: InputDecoration(
          labelText: 'Description'.tr(),
          labelStyle: TextStyle(
              fontWeight: FontWeight.bold, color: themeData.primaryColor,),
          floatingLabelBehavior: FloatingLabelBehavior.always,
          border: const OutlineInputBorder(),
          hintText: 'Enter the share description'.tr(),
          hintStyle: const TextStyle(
            fontWeight: FontWeight.normal,
            fontSize: 14,
          ),
        ),
        onTapOutside: (_) => descriptionFocusNode.unfocus(),
      );
    }

    Widget buildShowMetaButton() {
      return SwitchListTile.adaptive(
        value: showMetadata.value,
        onChanged: (value) => showMetadata.value = value,
        activeColor: themeData.primaryColor,
        dense: true,
        title: Text(
          "Show metadata".tr(),
          style: themeData.textTheme.labelLarge
              ?.copyWith(fontWeight: FontWeight.bold),
        ),
      );
    }

    Widget buildAllowDownloadButton() {
      return SwitchListTile.adaptive(
        value: allowDownload.value,
        onChanged: (value) => allowDownload.value = value,
        activeColor: themeData.primaryColor,
        dense: true,
        title: Text(
          "Allow public user to download".tr(),
          style: themeData.textTheme.labelLarge
              ?.copyWith(fontWeight: FontWeight.bold),
        ),
      );
    }

    Widget buildAllowUploadButton() {
      return SwitchListTile.adaptive(
        value: allowUpload.value,
        onChanged: (value) => allowUpload.value = value,
        activeColor: themeData.primaryColor,
        dense: true,
        title: Text(
          "Allow public user to upload".tr(),
          style: themeData.textTheme.labelLarge
              ?.copyWith(fontWeight: FontWeight.bold),
        ),
      );
    }

    Widget buildEditExpiryButton() {
      return SwitchListTile.adaptive(
        value: editExpiry.value,
        onChanged: (value) => editExpiry.value = value,
        activeColor: themeData.primaryColor,
        dense: true,
        title: Text(
          "Change expiration time".tr(),
          style: themeData.textTheme.labelLarge
              ?.copyWith(fontWeight: FontWeight.bold),
        ),
      );
    }

    Widget buildExpiryAfterButton() {
      return DropdownMenu(
        enableSearch: false,
        enableFilter: false,
        width: MediaQuery.of(context).size.width * 0.9,
        initialSelection: expiryAfter.value,
        enabled: existingLink == null || editExpiry.value,
        onSelected: (value) {
          expiryAfter.value = value!;
        },
        inputDecorationTheme: themeData.inputDecorationTheme.copyWith(
          disabledBorder: OutlineInputBorder(
            borderSide: BorderSide(color: Colors.grey.withOpacity(0.5)),
          ),
          enabledBorder: const OutlineInputBorder(
            borderSide: BorderSide(color: Colors.grey),
          ),
        ),
        dropdownMenuEntries: const [
          DropdownMenuEntry(value: 0, label: "Never"),
          DropdownMenuEntry(
            value: 30,
            label: '30 minutes',
          ),
          DropdownMenuEntry(
            value: 60,
            label: '1 hour',
          ),
          DropdownMenuEntry(
            value: 60 * 6,
            label: '6 hours',
          ),
          DropdownMenuEntry(
            value: 60 * 24,
            label: '1 day',
          ),
          DropdownMenuEntry(
            value: 60 * 24 * 7,
            label: '7 days',
          ),
          DropdownMenuEntry(
            value: 60 * 24 * 30,
            label: '30 days',
          ),
        ],
      );
    }

    calculateExpiry() {
      return DateTime.now().add(Duration(minutes: expiryAfter.value));
    }

    handleNewLink() async {
      await ref.read(sharedLinksStateProvider.notifier).createLink(
            albumId: albumId,
            assetIds: assetsList,
            showMeta: showMetadata.value,
            allowDownload: allowDownload.value,
            allowUpload: allowUpload.value,
            description: descriptionController.text.isEmpty
                ? null
                : descriptionController.text,
            expiresAt: expiryAfter.value == 0 ? null : calculateExpiry(),
          );
      AutoRouter.of(context).pop();
    }

    handleEditLink() async {
      bool? download;
      bool? upload;
      bool? meta;
      String? desc;
      DateTime? expiry;

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

      if (editExpiry.value) {
        expiry = expiryAfter.value == 0 ? null : calculateExpiry();
      }

      await ref.read(sharedLinksStateProvider.notifier).updateLink(
            id: existingLink!.id,
            showMeta: meta,
            allowDownload: download,
            allowUpload: upload,
            description: desc,
            expiresAt: expiry,
          );
      ref.invalidate(sharedLinksStateProvider);
      AutoRouter.of(context).pop();
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(getAppBarTitle()).tr(),
        elevation: 0,
        leading: const CloseButton(),
        centerTitle: false,
      ),
      resizeToAvoidBottomInset: false,
      body: SafeArea(
        child: Column(
          children: [
            Padding(padding: const EdgeInsets.all(20), child: buildLinkTitle()),
            Padding(
              padding: const EdgeInsets.all(20),
              child: buildDescriptionField(),
            ),
            Padding(
              padding: const EdgeInsets.only(left: 20, right: 20, bottom: 20),
              child: buildShowMetaButton(),
            ),
            Padding(
              padding: const EdgeInsets.only(left: 20, right: 20, bottom: 20),
              child: buildAllowDownloadButton(),
            ),
            Padding(
              padding: const EdgeInsets.only(left: 20, right: 20, bottom: 20),
              child: buildAllowUploadButton(),
            ),
            if (existingLink != null)
              Padding(
                padding: const EdgeInsets.only(left: 20, right: 20, bottom: 20),
                child: buildEditExpiryButton(),
              ),
            Padding(
              padding: const EdgeInsets.only(left: 20, right: 20, bottom: 20),
              child: buildExpiryAfterButton(),
            ),
            Align(
              alignment: Alignment.bottomRight,
              child: Padding(
                padding: const EdgeInsets.only(right: 30),
                child: ElevatedButton(
                  onPressed:
                      existingLink != null ? handleEditLink : handleNewLink,
                  child: Text(
                    existingLink != null ? "Update link" : "Create link",
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.bold,),
                  ).tr(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
