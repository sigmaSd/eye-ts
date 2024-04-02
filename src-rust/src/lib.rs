use serde::{Deserialize, Serialize};
use std::{
    ffi::CString,
    mem::ManuallyDrop,
    sync::{Arc, Mutex, MutexGuard},
};
mod utils;
use utils::cstr_to_type;

pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

#[derive(Serialize, Deserialize)]
struct World {
    size: usize,
}

pub struct HelloStruct {}
impl HelloStruct {
    fn new() -> Self {
        Self {}
    }
    fn hello(&self, world: World) -> World {
        println!("[rust] the world is big: {}", world.size);
        println!("[rust] take an even bigger world");

        World {
            size: world.size + 1,
        }
    }
}

#[no_mangle]
// can't use new since its a reserved keyword in javascript
pub extern "C" fn create() -> *const Mutex<HelloStruct> {
    Arc::into_raw(Arc::new(Mutex::new(HelloStruct::new())))
}

#[no_mangle]
/// # Safety
/// expects
/// - valid ptr to an Arc<Mutex<HelloStruct>>
/// - valid ptr to a World struct encoded as CString encoding a JSON value
/// returns a World struct encoded as CString encoding a JSON value
pub unsafe extern "C" fn hello(this: *const Mutex<HelloStruct>, world: *mut i8) -> *mut i8 {
    let this = ManuallyDrop::new(Arc::from_raw(this));
    let this = this.lock().expect("failed to aquire lock"); // is it safe ?

    // useful inner function that returns a result so we can use `?`
    fn result_wrap(this: MutexGuard<HelloStruct>, world: *mut i8) -> Result<*mut i8> {
        //SAFETY: world is valid by the guarentee of the parent function
        let world: World = unsafe { cstr_to_type(world)? };

        // inner function that have everything typed explicitly instead of pointers
        fn type_wrap(this: MutexGuard<HelloStruct>, world: World) -> World {
            this.hello(world)
        }

        Ok(CString::new(serde_json::to_string(&type_wrap(this, world))?)?.into_raw())
    }

    result_wrap(this, world).unwrap_or(std::ptr::null_mut())
}
