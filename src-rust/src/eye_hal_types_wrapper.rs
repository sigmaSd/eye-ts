use serde::{Deserialize, Serialize};

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
