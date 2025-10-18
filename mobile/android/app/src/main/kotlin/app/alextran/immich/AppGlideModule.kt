package app.alextran.immich

import android.content.Context
import com.bumptech.glide.GlideBuilder
import com.bumptech.glide.annotation.GlideModule
import com.bumptech.glide.load.engine.bitmap_recycle.BitmapPoolAdapter
import com.bumptech.glide.load.engine.cache.DiskCacheAdapter
import com.bumptech.glide.load.engine.cache.MemoryCacheAdapter
import com.bumptech.glide.module.AppGlideModule

@GlideModule
class AppGlideModule : AppGlideModule() {
  override fun applyOptions(context: Context, builder: GlideBuilder) {
    super.applyOptions(context, builder)
    // disable caching as this is already done on the Flutter side
    builder.setMemoryCache(MemoryCacheAdapter())
    builder.setDiskCache(DiskCacheAdapter.Factory())
    builder.setBitmapPool(BitmapPoolAdapter())
  }
}
