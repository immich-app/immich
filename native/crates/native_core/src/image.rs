use std::marker::PhantomData;
use std::mem::ManuallyDrop;
use std::ptr::NonNull;
use std::slice;
use std::sync::atomic::{AtomicBool, Ordering};

use crate::color::CicpProfile;
use crate::resize::{self, Lanczos};

/// Decoded pixels and the colour space they are in.
pub struct Image {
    pub cicp: CicpProfile,
    pub samples: Samples,
}

pub enum Samples {
    U8(Pixels<u8>),
    /// For HDR transfers, which need more than 8 bits.
    U16(Pixels<u16>),
}

/// Premultiplied RGBA pixels in a malloc'd buffer.
pub struct Pixels<T> {
    /// Initialized bytes from calloc or realloc that only self references.
    buf: NonNull<[u8]>,
    width: usize,
    height: usize,
    sample: PhantomData<T>,
}

pub(crate) trait Sample: Lanczos + Ord {
    const MAX: Self;

    /// Rounds like dividing the product by MAX would.
    fn scale(self, alpha: Self) -> Self;
}

impl Sample for u8 {
    const MAX: Self = u8::MAX;

    fn scale(self, alpha: Self) -> Self {
        let x = u16::from(self) * u16::from(alpha) + 128;
        ((x + (x >> 8)) >> 8) as u8
    }
}

impl Sample for u16 {
    const MAX: Self = u16::MAX;

    fn scale(self, alpha: Self) -> Self {
        let x = u32::from(self) * u32::from(alpha) + 32768;
        ((x + (x >> 16)) >> 16) as u16
    }
}

impl<T> Pixels<T> {
    /// Allocates pixels of u8 or u16 samples, the only kinds this module makes.
    pub(crate) fn zeroed(width: usize, height: usize, len: usize) -> Option<Self>
    where
        T: Sample,
    {
        // SAFETY: calloc has no preconditions.
        let ptr = NonNull::new(unsafe { libc::calloc(len, 1) }.cast())?;
        Some(Self {
            buf: NonNull::slice_from_raw_parts(ptr, len),
            width,
            height,
            sample: PhantomData,
        })
    }

    pub(crate) fn bytes_mut(&mut self) -> &mut [u8] {
        // SAFETY: self owns these initialized bytes.
        unsafe { self.buf.as_mut() }
    }

    fn pixels_mut(&mut self) -> &mut [[T; 4]] {
        let len = self.buf.len() / size_of::<[T; 4]>();
        // SAFETY: as for pixels, and self is borrowed mutably.
        unsafe { slice::from_raw_parts_mut(self.buf.as_ptr().cast(), len) }
    }

    /// Frees everything after the pixels.
    fn shrink(mut self) -> Option<Self> {
        let len = self.width * self.height * 4 * size_of::<T>();
        // SAFETY: the buffer is live and the pixels fill its first len bytes.
        let shrunk = unsafe { libc::realloc(self.buf.as_ptr().cast(), len) };
        // A failed realloc leaves the original buffer, which self still frees.
        self.buf = NonNull::slice_from_raw_parts(NonNull::new(shrunk.cast())?, len);
        Some(self)
    }

    /// Premultiplies if `alpha`, then downscales to cover `target` or frees everything after the
    /// pixels.
    pub(crate) fn finish(
        mut self,
        alpha: bool,
        target: Option<(usize, usize)>,
        cancelled: &AtomicBool,
    ) -> Option<Self>
    where
        T: Sample,
    {
        let (w, h) = (self.width, self.height);
        let pixels = &mut self.pixels_mut()[..w * h];
        if alpha {
            premultiply(pixels);
        }
        let Some((tw, th)) = target.and_then(|target| resize::cover((w, h), target)) else {
            return self.shrink();
        };
        // Resizing costs ~10% of a thumbnail decode, wasted on tiles that scrolled away meanwhile.
        if cancelled.load(Ordering::Relaxed) {
            return None;
        }
        let mut out = Self::zeroed(tw, th, tw * th * size_of::<[T; 4]>())?;
        resize::lanczos(pixels, (w, h), out.pixels_mut(), (tw, th))?;
        if alpha {
            // Lanczos3 overshoots, while premultiplied colour must stay within alpha.
            for px in out.pixels_mut() {
                let a = px[3];
                *px = px.map(|c| c.min(a));
            }
        }
        Some(out)
    }

    pub fn width(&self) -> usize {
        self.width
    }

    pub fn height(&self) -> usize {
        self.height
    }

    pub fn pixels(&self) -> &[[T; 4]] {
        let len = self.buf.len() / size_of::<[T; 4]>();
        // SAFETY: self owns these initialized bytes, and its u8 or u16 samples are valid for any
        // bytes and aligned by malloc.
        unsafe { slice::from_raw_parts(self.buf.as_ptr().cast(), len) }
    }

    /// Hands the buffer to a C caller, who frees it with free().
    pub fn into_raw(self) -> *mut u8 {
        ManuallyDrop::new(self).buf.as_ptr().cast()
    }
}

impl<T> Drop for Pixels<T> {
    fn drop(&mut self) {
        // SAFETY: self owns the buffer, which came from calloc or realloc.
        unsafe { libc::free(self.buf.as_ptr().cast()) };
    }
}

fn premultiply<T: Sample>(pixels: &mut [[T; 4]]) {
    // Alpha scaling itself at full opacity lets this vectorize as every lane does the same work.
    for px in pixels {
        let [r, g, b, a] = *px;
        *px = [r.scale(a), g.scale(a), b.scale(a), a.scale(T::MAX)];
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keeps_colour_within_alpha() {
        fn check<T: Sample>(half: T) {
            let (zero, max) = (T::default(), T::MAX);
            let mut px = Pixels::<T>::zeroed(16, 16, 16 * 16 * size_of::<[T; 4]>()).unwrap();
            // Opaque black against translucent white rings both ways across the edge.
            for (i, p) in px.pixels_mut().iter_mut().enumerate() {
                *p = if i % 16 < 8 {
                    [zero, zero, zero, max]
                } else {
                    [max, max, max, half]
                };
            }
            let px = px
                .finish(true, Some((5, 5)), &AtomicBool::new(false))
                .unwrap();
            for p in px.pixels() {
                assert!(p[..3].iter().all(|&c| c <= p[3]), "{p:?}");
            }
        }
        check(128u8);
        check(32768u16);
    }
}
