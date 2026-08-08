//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

import 'package:openapi/api.dart';
import 'package:test/test.dart';


/// tests for SyncApi
void main() {
  // final instance = SyncApi();

  group('tests for SyncApi', () {
    // Delete acknowledgements
    //
    // Delete specific synchronization acknowledgments.
    //
    //Future deleteSyncAck(SyncAckDeleteDto syncAckDeleteDto) async
    test('test deleteSyncAck', () async {
      // TODO
    });

    // Retrieve acknowledgements
    //
    // Retrieve the synchronization acknowledgments for the current session.
    //
    //Future<List<SyncAckDto>> getSyncAck() async
    test('test getSyncAck', () async {
      // TODO
    });

    // Stream sync changes
    //
    // Retrieve a JSON lines streamed response of changes for synchronization. This endpoint is used by the mobile app to efficiently stay up to date with changes.
    //
    //Future getSyncStream(SyncStreamDto syncStreamDto) async
    test('test getSyncStream', () async {
      // TODO
    });

    // Acknowledge changes
    //
    // Send a list of synchronization acknowledgements to confirm that the latest changes have been received.
    //
    //Future sendSyncAck(SyncAckSetDto syncAckSetDto) async
    test('test sendSyncAck', () async {
      // TODO
    });

  });
}
