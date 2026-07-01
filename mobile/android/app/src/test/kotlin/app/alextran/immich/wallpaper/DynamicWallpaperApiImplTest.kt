package app.alextran.immich.wallpaper

import android.content.Context
import android.os.Looper
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.junit.After
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf

@RunWith(RobolectricTestRunner::class)
class DynamicWallpaperApiImplTest {
  private val context: Context = RuntimeEnvironment.getApplication()

  @After
  fun tearDown() {
    context.getSharedPreferences(kDynamicWallpaperPrefsName, Context.MODE_PRIVATE)
      .edit()
      .clear()
      .commit()
    DynamicWallpaperConfigStore.preparedDirectory(context).deleteRecursively()
  }

  @Test
  fun `update selection without missing preparation does not prepare assets`() {
    val api = DynamicWallpaperApiImpl(context)
    val latch = CountDownLatch(1)
    var result: Result<Unit>? = null

    api.updateSelection(
      listOf(DynamicWallpaperAssetRef(remoteId = "remote-a", localId = null, isEdited = false)),
      emptyList(),
      prepareMissing = false,
    ) {
      result = it
      latch.countDown()
    }
    shadowOf(Looper.getMainLooper()).idle()

    assertTrue(latch.await(1, TimeUnit.SECONDS))
    assertTrue(result?.isSuccess == true)
    assertFalse(DynamicWallpaperConfigStore.hasPreparedFile(context, "remote-a"))
  }
}
