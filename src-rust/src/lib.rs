#![allow(clippy::blocks_in_conditions)]
use eye_hal::traits::{Context, Device, Stream};
use eye_hal::PlatformContext;
use serde::{Deserialize, Serialize};
use std::ffi::CString;
use std::mem::ManuallyDrop;
mod utils;
use utils::type_to_json_cstr;

pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

#[derive(Clone, Debug, Serialize, Deserialize)]
/// Image stream description
pub struct Descriptor {
    /// Width in pixels
    pub width: u32,
    /// Height in pixels
    pub height: u32,
    /// PixelFormat
    pub pixfmt: PixelFormat,
}
impl From<eye_hal::stream::Descriptor> for Descriptor {
    fn from(value: eye_hal::stream::Descriptor) -> Self {
        Self {
            width: value.width,
            height: value.height,
            pixfmt: value.pixfmt.into(),
        }
    }
}
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
/// Pixel format type used to describe image pixels.
///
/// Arbitrary formats can be wrapped in the Custom variant.
/// The other variants have values describing the depth of a whole pixel in bits.
pub enum PixelFormat {
    /// Special type for application defined formats
    Custom(String),

    /// Z buffers
    Depth(u32),
    /// Grayscale
    Gray(u32),

    /// Blue, Green, Red
    Bgr(u32),
    /// Red, Green, Blue
    Rgb(u32),

    /// JPEG compression
    Jpeg,
}
impl From<eye_hal::format::PixelFormat> for PixelFormat {
    fn from(value: eye_hal::format::PixelFormat) -> Self {
        match value {
            eye_hal::format::PixelFormat::Custom(fmt) => PixelFormat::Custom(fmt),
            eye_hal::format::PixelFormat::Depth(value) => PixelFormat::Depth(value),
            eye_hal::format::PixelFormat::Gray(value) => PixelFormat::Gray(value),
            eye_hal::format::PixelFormat::Bgr(value) => PixelFormat::Bgr(value),
            eye_hal::format::PixelFormat::Rgb(value) => PixelFormat::Rgb(value),
            eye_hal::format::PixelFormat::Jpeg => PixelFormat::Jpeg,
        }
    }
}

pub struct Camera {
    stream: Box<dyn Stream<'static, Item = std::result::Result<&'static [u8], eye_hal::Error>>>,
    stream_descriptor: Descriptor,
}

/// # Safety
/// TODO
#[no_mangle]
pub unsafe extern "C" fn create(ptr: *mut usize) -> i8 {
    #[allow(clippy::blocks_in_conditions)]
    match (|| -> Result<Camera> {
        // Create a context
        let ctx = PlatformContext::default();

        // Query for available devices.
        let devices = ctx.devices()?;

        // First, we need a capture device to read images from. For this example, let's just choose
        // whatever device is first in the list.
        let dev = ctx.open_device(&devices[0].uri)?;

        // Query for available streams and just choose the first one.
        let streams = dev.streams()?;
        let stream_desc = streams[0].clone();

        // Since we want to capture images, we need to access the native image stream of the device.
        // The backend will internally select a suitable implementation for the platform stream. On
        // Linux for example, most devices support memory-mapped buffers.
        let stream = dev.start_stream(&stream_desc)?;

        // Here we create a loop and just capture images as long as the device produces them. Normally,
        // this loop will run forever unless we unplug the camera or exit the program.
        // let frame = stream.next().ok_or("Stream is dead")??;
        Ok(Camera {
            stream: Box::new(stream),
            stream_descriptor: stream_desc.into(),
        })
    })() {
        Ok(camera) => {
            *ptr = Box::into_raw(Box::new(camera)) as _;
            0
        }
        Err(err) => {
            *ptr = CString::new(err.to_string())
                .expect("failed to create cstring")
                .into_raw() as _;
            -1
        }
    }
}

/// # Safety
/// TODO
#[no_mangle]
pub unsafe extern "C" fn next_frame(ptr: *mut Camera, res: *mut usize, len: *mut usize) -> i8 {
    match (|| -> Result<Vec<u8>> {
        let camera = Box::from_raw(ptr);
        let camera = Box::leak(camera);
        let frame = camera.stream.next().ok_or("Stream is dead")??.to_vec();
        Ok(frame)
    })() {
        Ok(mut frame) => {
            frame.shrink_to_fit();
            *res = frame.as_mut_ptr() as _;
            *len = frame.len();
            std::mem::forget(frame);
            0
        }
        Err(_) => todo!(),
    }
}

/// # Safety
/// TODO
#[no_mangle]
pub unsafe extern "C" fn stream_descriptor(ptr: *mut Camera, res: *mut usize) -> i8 {
    match {
        let camera = ManuallyDrop::new(Box::from_raw(ptr));
        type_to_json_cstr(&camera.stream_descriptor)
    } {
        Ok(desc) => {
            *res = desc.into_raw() as _;
            0
        }
        Err(_) => todo!(),
    }
}
