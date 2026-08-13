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


/// tests for MemoriesApi
void main() {
  // final instance = MemoriesApi();

  group('tests for MemoriesApi', () {
    // Add assets to a memory
    //
    // Add a list of asset IDs to a specific memory.
    //
    //Future<List<BulkIdResponseDto>> addMemoryAssets(String id, BulkIdsDto bulkIdsDto) async
    test('test addMemoryAssets', () async {
      // TODO
    });

    // Create a memory
    //
    // Create a new memory by providing a name, description, and a list of asset IDs to include in the memory.
    //
    //Future<MemoryResponseDto> createMemory(MemoryCreateDto memoryCreateDto) async
    test('test createMemory', () async {
      // TODO
    });

    // Delete a memory
    //
    // Delete a specific memory by its ID.
    //
    //Future deleteMemory(String id) async
    test('test deleteMemory', () async {
      // TODO
    });

    // Retrieve a memory
    //
    // Retrieve a specific memory by its ID.
    //
    //Future<MemoryResponseDto> getMemory(String id) async
    test('test getMemory', () async {
      // TODO
    });

    // Retrieve memories statistics
    //
    // Retrieve statistics about memories, such as total count and other relevant metrics.
    //
    //Future<MemoryStatisticsResponseDto> memoriesStatistics({ DateTime for_, bool isSaved, bool isTrashed, MemorySearchOrder order, int size, MemoryType type }) async
    test('test memoriesStatistics', () async {
      // TODO
    });

    // Remove assets from a memory
    //
    // Remove a list of asset IDs from a specific memory.
    //
    //Future<List<BulkIdResponseDto>> removeMemoryAssets(String id, BulkIdsDto bulkIdsDto) async
    test('test removeMemoryAssets', () async {
      // TODO
    });

    // Retrieve memories
    //
    // Retrieve a list of memories. Memories are sorted descending by creation date by default, although they can also be sorted in ascending order, or randomly.
    //
    //Future<List<MemoryResponseDto>> searchMemories({ DateTime for_, bool isSaved, bool isTrashed, MemorySearchOrder order, int size, MemoryType type }) async
    test('test searchMemories', () async {
      // TODO
    });

    // Update a memory
    //
    // Update an existing memory by its ID.
    //
    //Future<MemoryResponseDto> updateMemory(String id, MemoryUpdateDto memoryUpdateDto) async
    test('test updateMemory', () async {
      // TODO
    });

  });
}
