use std::marker::PhantomData;
use std::mem::ManuallyDrop;
use std::ptr::NonNull;
use std::slice;

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
    /// Allocates pixels of u8 or u16 samples, the only kinds this module makes, with `pixel_bytes`
    /// each if a decoder first writes them wider.
    pub(crate) fn zeroed(width: usize, height: usize, pixel_bytes: usize) -> Option<Self>
    where
        T: Sample,
    {
        let len = width
            .checked_mul(height)?
            .checked_mul(pixel_bytes.max(size_of::<[T; 4]>()))?;
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

    pub(crate) fn pixels_mut(&mut self) -> &mut [[T; 4]] {
        // SAFETY: as for pixels, and self is borrowed mutably.
        unsafe { slice::from_raw_parts_mut(self.buf.as_ptr().cast(), self.width * self.height) }
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

    /// Premultiplies if `alpha`, then resizes to `size`, or else frees everything after the pixels.
    pub(crate) fn premultiply_resize(
        mut self,
        alpha: bool,
        size: Option<(usize, usize)>,
    ) -> Option<Self>
    where
        T: Sample,
    {
        if alpha {
            self.premultiply();
        }
        let Some(size) = size else {
            return self.shrink();
        };
        let mut out = self.resize(size)?;
        if alpha {
            // Lanczos3 overshoots, while premultiplied colour must stay within alpha.
            out.clamp();
        }
        Some(out)
    }

    fn premultiply(&mut self)
    where
        T: Sample,
    {
        // Alpha scaling itself at full opacity lets this vectorize as every lane does the same work.
        for px in self.pixels_mut() {
            let [r, g, b, a] = *px;
            *px = [r.scale(a), g.scale(a), b.scale(a), a.scale(T::MAX)];
        }
    }

    /// Clamps colour to alpha.
    fn clamp(&mut self)
    where
        T: Sample,
    {
        for px in self.pixels_mut() {
            let a = px[3];
            *px = px.map(|c| c.min(a));
        }
    }

    /// The pixels resampled to `size` with Lanczos3, in a new buffer.
    fn resize(&self, (tw, th): (usize, usize)) -> Option<Self>
    where
        T: Sample,
    {
        let mut out = Self::zeroed(tw, th, size_of::<[T; 4]>())?;
        resize::lanczos(self, &mut out)?;
        Some(out)
    }

    pub fn width(&self) -> usize {
        self.width
    }

    pub fn height(&self) -> usize {
        self.height
    }

    pub fn pixels(&self) -> &[[T; 4]] {
        // SAFETY: zeroed made room for at least these initialized pixels, and their u8 or u16 samples are
        // valid for any bytes and aligned by malloc.
        unsafe { slice::from_raw_parts(self.buf.as_ptr().cast(), self.width * self.height) }
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keeps_colour_within_alpha() {
        fn check<T: Sample>(half: T) {
            let (zero, max) = (T::default(), T::MAX);
            let mut px = Pixels::<T>::zeroed(16, 16, size_of::<[T; 4]>()).unwrap();
            // Opaque black against translucent white rings both ways across the edge.
            for (i, p) in px.pixels_mut().iter_mut().enumerate() {
                *p = if i % 16 < 8 {
                    [zero, zero, zero, max]
                } else {
                    [max, max, max, half]
                };
            }
            let px = px.premultiply_resize(true, Some((5, 5))).unwrap();
            for p in px.pixels() {
                assert!(p[..3].iter().all(|&c| c <= p[3]), "{p:?}");
            }
        }
        check(128u8);
        check(32768u16);
    }
}
