use napi::bindgen_prelude::{
    AsyncTask, Buffer, Either, Env, Error, Result, Task, ToNapiValue, TypeName,
};
use napi_derive::napi;
use native_core::image::{self, Decode, Transform};
use native_core::io::{Dimensions, Encode, Source};
use native_core::vips;

#[napi]
pub fn version() -> &'static str {
    native_core::version()
}

fn reason(error: vips::Error) -> Error {
    Error::from_reason(error.to_string())
}

#[napi]
pub fn vips_version() -> Result<String> {
    vips::init().and_then(|()| vips::version()).map_err(reason)
}

pub struct Work<T>(Option<Box<dyn FnOnce() -> vips::Result<T> + Send>>);

impl<T: ToNapiValue + TypeName + Send + 'static> Work<T> {
    fn new(work: impl FnOnce() -> vips::Result<T> + Send + 'static) -> AsyncTask<Self> {
        AsyncTask::new(Self(Some(Box::new(work))))
    }
}

impl<T: ToNapiValue + TypeName + Send + 'static> Task for Work<T> {
    type Output = T;
    type JsValue = T;

    fn compute(&mut self) -> Result<T> {
        let work = self.0.take().expect("a task is computed once");
        work().map_err(reason)
    }

    fn resolve(&mut self, _: Env, output: T) -> Result<T> {
        Ok(output)
    }
}

fn source(input: &Either<String, Buffer>) -> Source<'_> {
    match input {
        Either::A(path) => Source::File(path),
        Either::B(buffer) => Source::Buffer(buffer),
    }
}

#[napi(object)]
pub struct Pixels {
    pub data: Buffer,
    pub width: u32,
    pub height: u32,
}

/// Held outside the JS heap, where the garbage collector cannot see its size.
#[napi]
pub struct Bitmap(Option<image::Bitmap>);

#[napi]
impl Bitmap {
    fn open(&self) -> Result<&image::Bitmap> {
        self.0
            .as_ref()
            .ok_or_else(|| Error::from_reason("the bitmap is closed"))
    }

    #[napi(getter)]
    pub fn width(&self) -> Result<u32> {
        Ok(self.open()?.width())
    }

    #[napi(getter)]
    pub fn height(&self) -> Result<u32> {
        Ok(self.open()?.height())
    }

    #[napi(getter)]
    pub fn is_transparent(&self) -> Result<bool> {
        Ok(self.open()?.has_alpha())
    }

    #[napi(ts_return_type = "Promise<void>")]
    pub fn save(
        &self,
        output: String,
        encode: Encode,
        transform: Transform,
    ) -> Result<AsyncTask<Work<()>>> {
        let bitmap = self.open()?.clone();
        Ok(Work::new(move || bitmap.save(&transform, encode, &output)))
    }

    #[napi(ts_return_type = "Promise<Pixels>")]
    pub fn pixels(&self, transform: Transform) -> Result<AsyncTask<Work<Pixels>>> {
        let bitmap = self.open()?.clone();
        Ok(Work::new(move || {
            let (data, width, height) = bitmap.rgba(&transform)?;
            Ok(Pixels {
                data: data.into(),
                width,
                height,
            })
        }))
    }

    #[napi]
    pub fn close(&mut self) {
        self.0 = None;
    }
}

#[napi(ts_return_type = "Promise<Bitmap>")]
pub fn decode_image(input: Either<String, Buffer>, options: Decode) -> AsyncTask<Work<Bitmap>> {
    Work::new(move || {
        Ok(Bitmap(Some(image::Bitmap::decode(
            source(&input),
            &options,
        )?)))
    })
}

#[napi(ts_return_type = "Promise<Dimensions>")]
pub fn image_dimensions(input: Either<String, Buffer>) -> AsyncTask<Work<Dimensions>> {
    Work::new(move || source(&input).dimensions())
}
