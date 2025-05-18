package app.alextran.immich.platform

import android.content.Context
import android.content.SharedPreferences
import android.database.Cursor
import android.net.Uri
import android.provider.MediaStore
import app.alextran.immich.platform.MediaManager.Companion.SHARED_PREF_MEDIA_STORE_GEN_KEY
import app.alextran.immich.platform.MediaManager.Companion.SHARED_PREF_MEDIA_STORE_VERSION_KEY
import app.alextran.immich.platform.MediaManager.Companion.SHARED_PREF_NAME
import io.mockk.Called
import io.mockk.CapturingSlot
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.slot
import io.mockk.unmockkAll
import io.mockk.verify
import kotlinx.serialization.json.Json
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder


class MediaManagerTest {

  private lateinit var mediaManager: MediaManager
  private lateinit var mockContext: Context
  private lateinit var mockPrefs: SharedPreferences
  private lateinit var mockEditor: SharedPreferences.Editor
  private lateinit var mockExternalUri: Uri
  private lateinit var mockContentResolver: android.content.ContentResolver

  @JvmField
  @Rule
  val tempFolder: TemporaryFolder = TemporaryFolder()

  @Before
  fun setUp() {
    mockContext = mockk(relaxed = true)
    mockContentResolver = mockk<android.content.ContentResolver>(relaxed = true)
    every { mockContext.applicationContext } returns mockContext
    every { mockContext.contentResolver } returns mockContentResolver

    mediaManager = MediaManager(mockContext)

    mockPrefs = mockk(relaxed = true)
    mockEditor = mockk(relaxed = true)

    every {
      mockContext.getSharedPreferences(
        SHARED_PREF_NAME,
        Context.MODE_PRIVATE
      )
    } returns mockPrefs
    every { mockPrefs.edit() } returns mockEditor
    every { mockEditor.putString(any(), any()) } returns mockEditor
    every { mockEditor.remove(any()) } returns mockEditor
    every { mockEditor.apply() } answers { }

    mockkStatic(Uri::class)
    mockExternalUri = mockk<Uri>()
    every { Uri.parse(any()) } returns mockExternalUri

    mockkStatic(MediaStore::class)
    mockkStatic(MediaStore.Files::class)
  }

  @After
  fun tearDown() {
    unmockkAll()
  }

  @Test
  fun `clearSyncCheckpoint removes keys from shared preferences`() {
    mediaManager.clearSyncCheckpoint()

    verify { mockEditor.remove(SHARED_PREF_MEDIA_STORE_VERSION_KEY) }
    verify { mockEditor.remove(SHARED_PREF_MEDIA_STORE_GEN_KEY) }
    verify { mockEditor.apply() }
  }

  @Test
  fun `shouldFullSync returns true when MediaStore version differs`() {
    every { MediaStore.getVersion(mockContext) } returns "v2"
    every { mockPrefs.getString(SHARED_PREF_MEDIA_STORE_VERSION_KEY, null) } returns "v1"

    assertTrue(mediaManager.shouldFullSync())
  }

  @Test
  fun `shouldFullSync returns true when no version`() {
    every { MediaStore.getVersion(mockContext) } returns "v1"
    every { mockPrefs.getString(SHARED_PREF_MEDIA_STORE_VERSION_KEY, null) } returns null

    assertTrue(mediaManager.shouldFullSync())
  }

  @Test
  fun `shouldFullSync returns false when MediaStore version is same`() {
    val currentVersion = "v2"
    every { MediaStore.getVersion(mockContext) } returns currentVersion
    every { mockPrefs.getString(SHARED_PREF_MEDIA_STORE_VERSION_KEY, null) } returns currentVersion

    assertFalse(mediaManager.shouldFullSync())
  }

  @Test
  fun `getAssetIdsForAlbum queries content resolver and returns IDs`() {
    val albumId = "recent_id"

    val mockCursor = mockk<Cursor>()
    every { mockCursor.moveToNext() } returnsMany listOf(true, true, false)
    every { mockCursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID) } returns 0
    every { mockCursor.getLong(0) } returnsMany listOf(123L, 456L)
    every { mockCursor.close() } answers { }

    every { MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL) } returns mockExternalUri
    every {
      mockContentResolver.query(
        eq(mockExternalUri),
        any(),
        eq("${MediaStore.Files.FileColumns.BUCKET_ID} = ? AND (${MediaStore.Files.FileColumns.MEDIA_TYPE} = ? OR ${MediaStore.Files.FileColumns.MEDIA_TYPE} = ?)"),
        eq(
          arrayOf(
            albumId,
            MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE.toString(),
            MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO.toString()
          )
        ),
        null
      )
    } returns mockCursor

    val assetIds = mediaManager.getAssetIdsForAlbum(albumId)

    assertEquals(listOf("123", "456"), assetIds)
    verify { mockCursor.close() }
  }

  @Test
  fun `checkpointSync stores current MediaStore version and generation`() {
    val testVersion = "v1"
    val volumeName = "external_primary"
    val generation = 12345L

    every { MediaStore.getVersion(mockContext) } returns testVersion
    every { MediaStore.getExternalVolumeNames(mockContext) } returns setOf(volumeName)
    every { MediaStore.getGeneration(mockContext, volumeName) } returns generation

    mediaManager.checkpointSync()

    verify { mockEditor.putString(SHARED_PREF_MEDIA_STORE_VERSION_KEY, testVersion) }
    val expectedGenMapJson = Json.encodeToString(mapOf(volumeName to generation))
    verify { mockEditor.putString(eq(SHARED_PREF_MEDIA_STORE_GEN_KEY), expectedGenMapJson) }
    verify { mockEditor.apply() }
  }

  @Test
  fun `getMediaChanges returns no changes when generations and volumes are same`() {
    val volumeName = "external_primary"
    val generation = 100L
    val genMap = mapOf(volumeName to generation)
    every {
      mockPrefs.getString(
        SHARED_PREF_MEDIA_STORE_GEN_KEY,
        null
      )
    } returns Json.encodeToString(genMap)
    every { MediaStore.getExternalVolumeNames(mockContext) } returns setOf(volumeName)
    every { MediaStore.getGeneration(mockContext, volumeName) } returns generation

    val result = mediaManager.getMediaChanges()

    assertFalse(result.hasChanges)
    assertTrue(result.updates.isEmpty())
    assertTrue(result.deletes.isEmpty())
    verify { mockContentResolver wasNot Called }
  }

  @Test
  fun `getMediaChanges detects new assets when generation increases`() {
    val volumeName = "external_primary"
    val oldGeneration = 100L
    val newGeneration = 101L
    val genMap = mapOf(volumeName to oldGeneration)

    val tempFile = tempFolder.newFile("image.jpg")

    every {
      mockPrefs.getString(SHARED_PREF_MEDIA_STORE_GEN_KEY, null)
    } returns Json.encodeToString(genMap)
    every { MediaStore.getExternalVolumeNames(mockContext) } returns setOf(volumeName)
    every { MediaStore.getGeneration(mockContext, volumeName) } returns newGeneration
    every { MediaStore.Files.getContentUri(volumeName) } returns mockExternalUri

    val assetProperties = MockAssetProperties(
      id = 1L,
      path = tempFile.absolutePath,
      displayName = "image.jpg",
      dateTaken = 1678886400000L,
      dateAdded = 1678886400L,
      dateModified = 1678886500L,
      mediaType = MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE,
      bucketId = "bucket1",
      duration = 0L
    )
    val mockCursor = mockCursorForMediaItems(listOf(assetProperties))
    val selectionSlot = slot<String>()
    val selectionArgsSlot = slot<Array<String>>()
    mockContentResolverQuery(mockExternalUri, mockCursor, selectionSlot, selectionArgsSlot)

    val result = mediaManager.getMediaChanges()

    assertTrue(result.hasChanges)
    assertEquals(1, result.updates.size)
    assertEquals("1", result.updates[0].id)
    assertEquals("image.jpg", result.updates[0].name)
    assertEquals(1678886400L, result.updates[0].createdAt)
    assertEquals(1678886500000L, result.updates[0].updatedAt)
    assertTrue(result.deletes.isEmpty())

    assertEquals(
      "(${MediaStore.Files.FileColumns.MEDIA_TYPE} = ? OR ${MediaStore.Files.FileColumns.MEDIA_TYPE} = ?) AND (${MediaStore.MediaColumns.GENERATION_MODIFIED} > ? OR ${MediaStore.MediaColumns.GENERATION_ADDED} > ?)",
      selectionSlot.captured
    )
    assertEquals(oldGeneration.toString(), selectionArgsSlot.captured[2])
    assertEquals(oldGeneration.toString(), selectionArgsSlot.captured[3])

    verify { mockCursor.close() }
  }

  @Test
  fun `getMediaChanges detects deleted assets when file path does not exist`() {
    val volumeName = "external_primary"
    val oldGeneration = 100L
    val newGeneration = 101L
    val genMap = mapOf(volumeName to oldGeneration)

    every {
      mockPrefs.getString(SHARED_PREF_MEDIA_STORE_GEN_KEY, null)
    } returns Json.encodeToString(genMap)
    every { MediaStore.getExternalVolumeNames(mockContext) } returns setOf(volumeName)
    every { MediaStore.getGeneration(mockContext, volumeName) } returns newGeneration
    every { MediaStore.Files.getContentUri(volumeName) } returns mockExternalUri

    val assetProperties = MockAssetProperties(
      id = 2L,
      path = "/path/to/deleted_image.jpg",
      displayName = "deleted_image.jpg",
      dateTaken = 0L, dateAdded = 0L, dateModified = 0L,
      mediaType = MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE,
      bucketId = "bucket_deleted",
      duration = 0L
    )
    val mockCursor = mockCursorForMediaItems(listOf(assetProperties))
    mockContentResolverQuery(mockExternalUri, mockCursor)

    val result = mediaManager.getMediaChanges()

    assertTrue(result.hasChanges)
    assertTrue(result.updates.isEmpty())
    assertEquals(1, result.deletes.size)
    assertEquals("2", result.deletes[0])
    verify { mockCursor.close() }
  }

  @Test
  fun `getMediaChanges handles multiple volumes with additions and deletions`() {
    val volume1Name = "external_primary"
    val volume2Name = "sd_card"
    val initialGenVolume1 = 100L
    val initialGenVolume2 = 50L
    val newGenVolume1 = 101L
    val newGenVolume2 = 51L

    val initialGenMap = mapOf(volume1Name to initialGenVolume1, volume2Name to initialGenVolume2)
    every {
      mockPrefs.getString(SHARED_PREF_MEDIA_STORE_GEN_KEY, null)
    } returns Json.encodeToString(initialGenMap)

    every { MediaStore.getExternalVolumeNames(mockContext) } returns setOf(volume1Name, volume2Name)
    every { MediaStore.getGeneration(mockContext, volume1Name) } returns newGenVolume1
    every { MediaStore.getGeneration(mockContext, volume2Name) } returns newGenVolume2

    val mockUriVolume1 = mockk<Uri>()
    val mockUriVolume2 = mockk<Uri>()
    every { MediaStore.Files.getContentUri(volume1Name) } returns mockUriVolume1
    every { MediaStore.Files.getContentUri(volume2Name) } returns mockUriVolume2

    val tempFile1 = tempFolder.newFile("image_vol1.jpg")
    val assetVol1 = MockAssetProperties(
      id = 10L,
      path = tempFile1.absolutePath,
      displayName = "image_vol1.jpg",
      dateTaken = 1678886400000L,
      dateAdded = 1678886400L,
      dateModified = 1678886500L,
      mediaType = MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE,
      bucketId = "bucket_vol1",
      duration = 0L
    )
    val mockCursorVol1 = mockCursorForMediaItems(listOf(assetVol1))
    val selectionArgsSlotVol1 = slot<Array<String>>()
    mockContentResolverQuery(
      mockUriVolume1,
      mockCursorVol1,
      selectionArgsSlot = selectionArgsSlotVol1
    )

    val assetVol2Deleted = MockAssetProperties(
      id = 20L,
      path = "/path/to/deleted_vol2.jpg",
      displayName = "deleted_vol2.jpg",
      dateTaken = 0L,
      dateAdded = 0L,
      dateModified = 0L,
      mediaType = MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE,
      bucketId = "bucket_vol2_del",
      duration = 0L
    )
    val mockCursorVol2 = mockCursorForMediaItems(listOf(assetVol2Deleted))
    val selectionArgsSlotVol2 = slot<Array<String>>()
    mockContentResolverQuery(
      mockUriVolume2,
      mockCursorVol2,
      selectionArgsSlot = selectionArgsSlotVol2
    )

    val result = mediaManager.getMediaChanges()

    assertTrue(result.hasChanges)
    assertEquals(1, result.updates.size)
    assertEquals("10", result.updates[0].id)
    assertEquals("image_vol1.jpg", result.updates[0].name)

    assertEquals(1, result.deletes.size)
    assertEquals("20", result.deletes[0])

    assertEquals(initialGenVolume1.toString(), selectionArgsSlotVol1.captured[2])
    assertEquals(initialGenVolume1.toString(), selectionArgsSlotVol1.captured[3])
    assertEquals(initialGenVolume2.toString(), selectionArgsSlotVol2.captured[2])
    assertEquals(initialGenVolume2.toString(), selectionArgsSlotVol2.captured[3])

    verify { mockCursorVol1.close() }
    verify { mockCursorVol2.close() }
  }

  @Test
  fun `getMediaChanges detects new volume`() {
    val volume1Name = "external_primary"
    val initialGenVolume1 = 100L
    val initialGenMap = mapOf(volume1Name to initialGenVolume1)

    val volume2Name = "new_sd_card"
    val newGenVolume1 = 100L
    val newGenVolume2 = 5L

    every {
      mockPrefs.getString(SHARED_PREF_MEDIA_STORE_GEN_KEY, null)
    } returns Json.encodeToString(initialGenMap)

    every { MediaStore.getExternalVolumeNames(mockContext) } returns setOf(volume1Name, volume2Name)
    every { MediaStore.getGeneration(mockContext, volume1Name) } returns newGenVolume1
    every { MediaStore.getGeneration(mockContext, volume2Name) } returns newGenVolume2

    val mockUriVolume2 = mockk<Uri>()
    every { MediaStore.Files.getContentUri(volume2Name) } returns mockUriVolume2

    val tempFile2 = tempFolder.newFile("image_vol2.jpg")
    val assetVol2 = MockAssetProperties(
      id = 30L,
      path = tempFile2.absolutePath,
      displayName = "image_vol2.jpg",
      dateTaken = 0L,
      dateAdded = 1678886600L,
      dateModified = 1678886700L,
      mediaType = MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE,
      bucketId = "bucket_vol2",
      duration = 0L
    )
    val mockCursorVol2 = mockCursorForMediaItems(listOf(assetVol2))
    val selectionArgsSlotVol2 = slot<Array<String>>()
    mockContentResolverQuery(
      mockUriVolume2,
      mockCursorVol2,
      selectionArgsSlot = selectionArgsSlotVol2
    )

    val result = mediaManager.getMediaChanges()

    assertTrue(result.hasChanges)
    assertEquals(1, result.updates.size)
    assertEquals("30", result.updates[0].id)
    assertEquals(1678886600L, result.updates[0].createdAt)
    assertTrue(result.deletes.isEmpty())

    assertEquals(
      "0",
      selectionArgsSlotVol2.captured[2]
    )
    assertEquals("0", selectionArgsSlotVol2.captured[3])

    verify(exactly = 0) {
      mockContentResolver.query(
        eq(MediaStore.Files.getContentUri(volume1Name)),
        any(),
        any(),
        any(),
        null
      )
    }
    verify { mockCursorVol2.close() }
  }

  @Test
  fun `getMediaChanges handles removed volume`() {
    val volume1Name = "external_primary"
    val volume2Name = "sd_card_to_be_removed"
    val initialGenVolume1 = 100L
    val initialGenVolume2 = 50L

    val initialGenMap = mapOf(volume1Name to initialGenVolume1, volume2Name to initialGenVolume2)
    every {
      mockPrefs.getString(
        SHARED_PREF_MEDIA_STORE_GEN_KEY,
        null
      )
    } returns Json.encodeToString(initialGenMap)

    every { MediaStore.getExternalVolumeNames(mockContext) } returns setOf(volume1Name)
    every { MediaStore.getGeneration(mockContext, volume1Name) } returns initialGenVolume1

    val result = mediaManager.getMediaChanges()

    assertTrue(result.hasChanges)
    // No updates or deletes should be reported by this function for removed volumes,
    // as this is handled by the Dart side based on album removal.
    assertTrue(result.updates.isEmpty())
    assertTrue(result.deletes.isEmpty())

    verify { mockContentResolver wasNot Called }
  }

  private data class MockAssetProperties(
    val id: Long,
    val path: String,
    val displayName: String,
    val dateTaken: Long,
    val dateAdded: Long,
    val dateModified: Long,
    val mediaType: Int,
    val bucketId: String,
    val duration: Long
  )

  private fun mockCursorForMediaItems(items: List<MockAssetProperties>): Cursor {
    val mockCursor = mockk<Cursor>()
    var currentIndex = -1

    every { mockCursor.moveToNext() } answers {
      currentIndex++
      currentIndex < items.size
    }

    if (items.isNotEmpty()) {
      every { mockCursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID) } returns 0
      every { mockCursor.getLong(0) } answers { items[currentIndex].id }
      every { mockCursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATA) } returns 1
      every { mockCursor.getString(1) } answers { items[currentIndex].path }
      every { mockCursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DISPLAY_NAME) } returns 2
      every { mockCursor.getString(2) } answers { items[currentIndex].displayName }
      every { mockCursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_TAKEN) } returns 3
      every { mockCursor.getLong(3) } answers { items[currentIndex].dateTaken }
      every { mockCursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_ADDED) } returns 4
      every { mockCursor.getLong(4) } answers { items[currentIndex].dateAdded }
      every { mockCursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_MODIFIED) } returns 5
      every { mockCursor.getLong(5) } answers { items[currentIndex].dateModified }
      every { mockCursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MEDIA_TYPE) } returns 6
      every { mockCursor.getInt(6) } answers { items[currentIndex].mediaType }
      every { mockCursor.getColumnIndexOrThrow(MediaStore.MediaColumns.BUCKET_ID) } returns 7
      every { mockCursor.getString(7) } answers { items[currentIndex].bucketId }
      every { mockCursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DURATION) } returns 8
      every { mockCursor.getLong(8) } answers { items[currentIndex].duration }
    }
    every { mockCursor.close() } answers { }
    return mockCursor
  }

  private fun mockContentResolverQuery(
    uri: Uri,
    cursor: Cursor,
    selectionSlot: CapturingSlot<String>? = null,
    selectionArgsSlot: CapturingSlot<Array<String>>? = null
  ) {
    every {
      mockContentResolver.query(
        eq(uri),
        any(),
        if (selectionSlot != null) capture(selectionSlot) else any(),
        if (selectionArgsSlot != null) capture(selectionArgsSlot) else any(),
        null
      )
    } returns cursor
  }

}
