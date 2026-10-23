use std::fmt::Debug;
use std::sync::{Arc, LazyLock};

use pic_scale::{
    ImageSize, ImageStore, ImageStoreMut, Resampling, ResamplingFunction, Scaler, WorkloadStrategy,
};
use quick_cache::sync::Cache;

use crate::image::Pixels;

/// Reuse the resampling plan for a given src-dst image size pair.
type Plans<T> = Cache<[usize; 4], Arc<Resampling<T, 4>>>;

const PLANS: usize = 16;

pub(crate) trait Lanczos: Copy + Default + Debug + 'static {
    fn plan(from: ImageSize, to: ImageSize) -> Option<Arc<Resampling<Self, 4>>>;

    fn cache() -> &'static Plans<Self>;
}

impl Lanczos for u8 {
    fn plan(from: ImageSize, to: ImageSize) -> Option<Arc<Resampling<Self, 4>>> {
        // The 8-bit speed path brightens by up to two levels and is barely faster.
        Scaler::new(ResamplingFunction::Lanczos3)
            .set_workload_strategy(WorkloadStrategy::PreferQuality)
            .plan_rgba_resampling(from, to, false)
            .ok()
    }

    fn cache() -> &'static Plans<Self> {
        static CACHE: LazyLock<Plans<u8>> = LazyLock::new(|| Cache::new(PLANS));
        &CACHE
    }
}

impl Lanczos for u16 {
    fn plan(from: ImageSize, to: ImageSize) -> Option<Arc<Resampling<Self, 4>>> {
        Scaler::new(ResamplingFunction::Lanczos3)
            .plan_rgba_resampling16(from, to, false, 16)
            .ok()
    }

    fn cache() -> &'static Plans<Self> {
        static CACHE: LazyLock<Plans<u16>> = LazyLock::new(|| Cache::new(PLANS));
        &CACHE
    }
}

/// The size of `size` scaled to cover `target`, if smaller.
pub(crate) fn cover((w, h): (usize, usize), (tw, th): (usize, usize)) -> Option<(usize, usize)> {
    let size = if tw * h >= th * w {
        (tw, (h * tw).div_ceil(w))
    } else {
        ((w * th).div_ceil(h), th)
    };
    (size.0 * size.1 < w * h).then_some(size)
}

/// Resamples `src` into `dst` with Lanczos3.
pub(crate) fn lanczos<T: Lanczos>(src: &Pixels<T>, dst: &mut Pixels<T>) -> Option<()> {
    let [w, h, tw, th] = [src.width(), src.height(), dst.width(), dst.height()];
    let from = ImageStore::borrow(src.pixels().as_flattened(), w, h).ok()?;
    let mut to = ImageStoreMut::borrow(dst.pixels_mut().as_flattened_mut(), tw, th).ok()?;
    to.bit_depth = 8 * size_of::<T>();
    T::cache()
        .get_or_insert_with(&[w, h, tw, th], || {
            T::plan(from.size(), to.size()).ok_or(())
        })
        .ok()?
        .resample(&from, &mut to)
        .ok()
}
