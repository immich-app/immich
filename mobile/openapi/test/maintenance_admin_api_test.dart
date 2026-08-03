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


/// tests for MaintenanceAdminApi
void main() {
  // final instance = MaintenanceAdminApi();

  group('tests for MaintenanceAdminApi', () {
    // Delete integrity report item
    //
    // Delete a given report item and perform corresponding deletion (e.g. trash asset, delete file)
    //
    //Future deleteIntegrityReport(String id) async
    test('test deleteIntegrityReport', () async {
      // TODO
    });

    // Detect existing install
    //
    // Collect integrity checks and other heuristics about local data.
    //
    //Future<MaintenanceDetectInstallResponseDto> detectPriorInstall() async
    test('test detectPriorInstall', () async {
      // TODO
    });

    // Get integrity report by type
    //
    // Get all flagged items by integrity report type
    //
    //Future<IntegrityReportResponseDto> getIntegrityReport(IntegrityReport type, { String cursor, int limit }) async
    test('test getIntegrityReport', () async {
      // TODO
    });

    // Export integrity report by type as CSV
    //
    // Get all integrity report entries for a given type as a CSV
    //
    //Future<MultipartFile> getIntegrityReportCsv(IntegrityReport type) async
    test('test getIntegrityReportCsv', () async {
      // TODO
    });

    // Download flagged file
    //
    // Download the untracked/broken file if one exists
    //
    //Future<MultipartFile> getIntegrityReportFile(String id) async
    test('test getIntegrityReportFile', () async {
      // TODO
    });

    // Get integrity report summary
    //
    // Get a count of the items flagged in each integrity report
    //
    //Future<IntegrityReportSummaryResponseDto> getIntegrityReportSummary() async
    test('test getIntegrityReportSummary', () async {
      // TODO
    });

    // Get maintenance mode status
    //
    // Fetch information about the currently running maintenance action.
    //
    //Future<MaintenanceStatusResponseDto> getMaintenanceStatus() async
    test('test getMaintenanceStatus', () async {
      // TODO
    });

    // Log into maintenance mode
    //
    // Login with maintenance token or cookie to receive current information and perform further actions.
    //
    //Future<MaintenanceAuthDto> maintenanceLogin(MaintenanceLoginDto maintenanceLoginDto) async
    test('test maintenanceLogin', () async {
      // TODO
    });

    // Set maintenance mode
    //
    // Put Immich into or take it out of maintenance mode
    //
    //Future setMaintenanceMode(SetMaintenanceModeDto setMaintenanceModeDto) async
    test('test setMaintenanceMode', () async {
      // TODO
    });

  });
}
