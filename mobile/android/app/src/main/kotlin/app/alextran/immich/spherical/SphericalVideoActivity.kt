package app.alextran.immich.spherical

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.view.Gravity
import android.view.Surface
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.annotation.OptIn
import androidx.core.content.ContextCompat
import androidx.media3.common.AudioAttributes
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.ProgressiveMediaSource
import androidx.media3.exoplayer.video.spherical.SphericalGLSurfaceView
import androidx.media3.ui.PlayerControlView
import androidx.media3.ui.R as Media3UiR
import app.alextran.immich.core.HttpClientManager

/**
 * Full-screen player for 360° (equirectangular) videos, launched from Flutter for assets whose EXIF
 * projection type is EQUIRECTANGULAR. Media3 renders videos without spherical metadata as full
 * equirectangular spheres, which is what immich transcodes produce. Streams are fetched through the
 * app's [HttpClientManager], so server authentication works like everywhere else in the app.
 */
@OptIn(UnstableApi::class)
class SphericalVideoActivity : ComponentActivity() {
  private var player: ExoPlayer? = null
  private var sphericalView: SphericalGLSurfaceView? = null

  private val videoSurfaceListener = object : SphericalGLSurfaceView.VideoSurfaceListener {
    override fun onVideoSurfaceCreated(surface: Surface) {
      player?.setVideoSurface(surface)
    }

    override fun onVideoSurfaceDestroyed(surface: Surface) {
      player?.setVideoSurface(null)
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

    val url = intent.getStringExtra(EXTRA_URL)
    if (url == null) {
      Log.e(TAG, "Missing url extra")
      finish()
      return
    }

    val root = FrameLayout(this)
    val view = SphericalGLSurfaceView(this)
    view.addVideoSurfaceListener(videoSurfaceListener)
    sphericalView = view
    root.addView(
      view,
      FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT),
    )

    val exoPlayer = ExoPlayer.Builder(this).build()
    player = exoPlayer
    exoPlayer.setAudioAttributes(AudioAttributes.DEFAULT, /* handleAudioFocus= */ true)
    exoPlayer.addListener(
      object : Player.Listener {
        override fun onPlayerError(error: PlaybackException) {
          Log.e(TAG, "Spherical playback failed", error)
          Toast.makeText(this@SphericalVideoActivity, error.getErrorCodeName(), Toast.LENGTH_LONG).show()
        }
      },
    )
    exoPlayer.setMediaSource(
      ProgressiveMediaSource.Factory(HttpClientManager.createDataSourceFactory(emptyMap()))
        .createMediaSource(MediaItem.fromUri(url)),
    )
    exoPlayer.prepare()
    exoPlayer.playWhenReady = true

    exoPlayer.setVideoFrameMetadataListener(view.videoFrameMetadataListener)
    view.videoSurface?.let(exoPlayer::setVideoSurface)

    val controls = PlayerControlView(this)
    controls.player = exoPlayer
    root.addView(
      controls,
      FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.WRAP_CONTENT,
        Gravity.BOTTOM,
      ),
    )

    val closeButton = ImageButton(this).apply {
      setImageDrawable(ContextCompat.getDrawable(this@SphericalVideoActivity, Media3UiR.drawable.exo_ic_fullscreen_exit))
      setBackgroundColor(Color.TRANSPARENT)
      setColorFilter(Color.WHITE)
      contentDescription = "Close"
      setOnClickListener { finish() }
    }
    val closeMargin = (16 * resources.displayMetrics.density).toInt()
    root.addView(
      closeButton,
      FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.WRAP_CONTENT,
        FrameLayout.LayoutParams.WRAP_CONTENT,
        Gravity.TOP or Gravity.END,
      ).apply { setMargins(closeMargin, closeMargin, closeMargin, closeMargin) },
    )

    setContentView(root)
  }

  override fun onResume() {
    super.onResume()
    sphericalView?.onResume()
  }

  override fun onPause() {
    sphericalView?.onPause()
    super.onPause()
  }

  override fun onStop() {
    player?.playWhenReady = false
    super.onStop()
  }

  override fun onDestroy() {
    sphericalView?.removeVideoSurfaceListener(videoSurfaceListener)
    player?.release()
    player = null
    sphericalView = null
    super.onDestroy()
  }

  companion object {
    private const val TAG = "SphericalVideoActivity"
    private const val EXTRA_URL = "url"

    fun intent(context: Context, url: String): Intent =
      Intent(context, SphericalVideoActivity::class.java).putExtra(EXTRA_URL, url)
  }
}
