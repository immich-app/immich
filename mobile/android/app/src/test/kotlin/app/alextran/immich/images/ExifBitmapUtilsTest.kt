package app.alextran.immich.images

import android.content.Context
import android.graphics.Bitmap
import androidx.exifinterface.media.ExifInterface
import java.io.File
import java.io.FileOutputStream
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class ExifBitmapUtilsTest {
  private val context: Context = RuntimeEnvironment.getApplication()
  private val testDirectory = File(context.cacheDir, "exif-bitmap-utils-test")

  @After
  fun tearDown() {
    testDirectory.deleteRecursively()
  }

  @Test
  fun `decodeSampledBitmap applies exif rotation`() {
    val image = jpegWithOrientation(
      width = 20,
      height = 10,
      orientation = ExifInterface.ORIENTATION_ROTATE_90,
    )

    val bitmap = ExifBitmapUtils.decodeSampledBitmap(image.readBytes(), 100, 100)

    assertEquals(10, bitmap?.width)
    assertEquals(20, bitmap?.height)
    bitmap?.recycle()
  }

  private fun jpegWithOrientation(width: Int, height: Int, orientation: Int): File {
    testDirectory.mkdirs()
    val file = File(testDirectory, "oriented.jpg")
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    FileOutputStream(file).use { output ->
      bitmap.compress(Bitmap.CompressFormat.JPEG, 95, output)
    }
    bitmap.recycle()

    ExifInterface(file.absolutePath).apply {
      setAttribute(ExifInterface.TAG_ORIENTATION, orientation.toString())
      saveAttributes()
    }
    return file
  }
}
