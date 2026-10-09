import 'dart:async';
import 'dart:io';

import 'package:flutter/widgets.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

/// [ImmichLogger] is a custom logger that is built on top of the [logging] package.
/// The logs are written to the database and onto console, using `debugPrint` method.
///
/// The logs are deleted when exceeding the `maxLogEntries` (default 500) property
/// in the class.
///
/// Logs can be shared by calling the `shareLogs` method, which will open a share dialog
/// and generate a csv file.
abstract final class ImmichLogger {
  static final _url = RegExp(r'''\w+://[^\s'",]+''');

  @visibleForTesting
  static RegExp sensitive(Iterable<String> held, Iterable<String> logs) => RegExp(
    [
      // the urls, hosts, token, wifi name and header values this install holds, and the host of every url in the
      // logs, since a server it no longer holds still shows up in one; wherever an error puts them, like ios
      // certificate errors (pretending to be “host”) or okhttp (Failed to connect to host/ip:port);
      // shorter values would match normal words
      for (final value in {
        ...held,
        for (final log in logs)
          for (final url in _url.allMatches(log)) ?Uri.tryParse(url[0]!)?.host,
      })
        if (value.length >= 8) RegExp.escape(value),
      // hosts it no longer holds: after :// in a url, in dart:io socket errors (host lookup: 'x', address = x,
      // host: x), and the access token older app versions logged
      r"(?<=://|host lookup: '|address = |host: |access token: )[^\s/?#,']+",
      // IPv4 addresses, like the one okhttp prints after the host
      r'\b\d{1,3}(?:\.\d{1,3}){3}\b',
      // emails, like the one the oauth login logs
      r'[\w.+-]+@[\w-]+(?:\.[\w-]+)+',
      // the oauth code in a logged callback url
      r'(?<=[?&]code=)[^&\s#]+',
      // the values a failed sqlite statement was given, like the pin hash or an email in a sync upsert
      r'(?<=, parameters: ).+',
    ].join('|'),
    caseSensitive: false,
  );

  static Iterable<String> _held() {
    final network = SettingsRepository.instance.appConfig.network;
    final urls = [
      Store.tryGet(StoreKey.serverUrl),
      Store.tryGet(StoreKey.serverEndpoint),
      network.localEndpoint,
      ...network.externalEndpointList,
    ];
    return [
      for (final url in urls.nonNulls) ...[url, ?Uri.tryParse(url)?.host],
      ?Store.tryGet(StoreKey.accessToken),
      ?network.preferredWifiName,
      ...network.customHeaders.values,
    ];
  }

  static Future<void> shareLogs(BuildContext context) async {
    final messages = await LogService.I.getMessages();
    final hidden = sensitive(_held(), [
      for (final m in messages) ...[m.message, ?m.error, ?m.stack],
    ]);
    final tempDir = await getTemporaryDirectory();
    final dateTime = DateTime.now().toIso8601String();
    final filePath = '${tempDir.path}/Immich_log_$dateTime.log';
    final logFile = await File(filePath).create();
    final io = logFile.openWrite();
    try {
      // Write messages
      for (final m in messages) {
        final created = m.createdAt;
        final level = m.level.name.padRight(8);
        final logger = (m.logger ?? "<UNKNOWN_LOGGER>").padRight(20);
        final message = m.message;
        final error = m.error == null ? "" : " ${m.error} |";
        final stack = m.stack == null ? "" : "\n${m.stack!}";
        io.write('$created | $level | $logger | $message |$error$stack\n'.replaceAll(hidden, '<redacted>'));
      }
    } finally {
      await io.flush();
      await io.close();
    }

    if (!context.mounted) {
      return;
    }

    final box = context.findRenderObject() as RenderBox?;

    // Share file
    await Share.shareXFiles(
      [XFile(filePath)],
      subject: "Immich logs $dateTime",
      sharePositionOrigin: box!.localToGlobal(Offset.zero) & box.size,
    ).then((value) => logFile.delete());
  }
}
