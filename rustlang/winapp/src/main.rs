#![windows_subsystem = "windows"]
#![allow(unused_parens)]
#![allow(dead_code)]
#![allow(unused_imports)]


use std::{
    ffi::OsStr,
    os::windows::ffi::OsStrExt,
    iter::once,
    mem,
    ptr::null_mut,
    io::Error
};

use winapi::{
    ctypes::c_void,
    shared::{
        windef::{
            HWND,
            RECT,
            HCURSOR,
            HBRUSH
        },
        minwindef::{
            LRESULT,
            LPARAM,
            WPARAM,
            UINT
        },
        ntdef::{
            LONG,
            NULL
        }
    },
    um::{
        libloaderapi::{
            GetModuleHandleW,
        },
        wingdi::{
            GetStockObject,
            WHITE_BRUSH
        },
        winuser::{
        // WNDCLASS
        WNDCLASSW,
        CS_HREDRAW,
        CS_VREDRAW,
        CS_OWNDC,
        CW_USEDEFAULT,
        RegisterClassW,
        SetClassLongW,

        // CreateWindow
        WS_OVERLAPPEDWINDOW,
        WS_VISIBLE,
        CreateWindowExW,

        // Message Loop
        TranslateMessage,
        DispatchMessageW,
        GetMessageW,
        DefWindowProcW,
        PostQuitMessage,
        PostMessageW,
        MSG,

        // Message Constants
        WM_USER,
        WM_CREATE,
        WM_DESTROY,
        WM_PAINT,
        WM_SIZE,
        WM_SETCURSOR,
        WM_MOUSEMOVE,
        WM_LBUTTONDOWN,
        WM_LBUTTONUP,
        WM_KEYDOWN,
        WM_KEYUP,
        WM_CHAR,

        // Cursors
        LoadCursorW,
        SetCursor,
        IDC_ARROW,
        IDC_WAIT,
        IDC_HAND,
        IDC_IBEAM,

        // Icons
        LoadIconW,
        IDI_APPLICATION,

        // Color
        COLOR_WINDOW
    }}
};

fn win32_string(value: &str) -> Vec<u16> {
    OsStr::new(value).encode_wide().chain(once(0)).collect()
}

fn create_window(name: &str, title: &str) -> HWND {
    let name = win32_string(name);
    let title = win32_string(title);
    unsafe {
        let white_brush = GetStockObject(WHITE_BRUSH.try_into().unwrap());
        let hinstance = GetModuleHandleW(null_mut());
        let wnd_class = WNDCLASSW {
            style: CS_HREDRAW | CS_VREDRAW,
            lpfnWndProc: Some(win32_wnd_proc),
            hInstance: hinstance,
            lpszClassName: name.as_ptr(),
            cbClsExtra: 0,
            cbWndExtra: 0,
            hIcon: LoadIconW(null_mut(), IDI_APPLICATION),
            hCursor: null_mut(),
            hbrBackground: white_brush as HBRUSH,
            lpszMenuName: null_mut()
        };

        RegisterClassW(&wnd_class);

        let handle = CreateWindowExW(
            0,
            name.as_ptr(),
            title.as_ptr(),
            WS_OVERLAPPEDWINDOW | WS_VISIBLE,
            CW_USEDEFAULT, // X
            CW_USEDEFAULT, // Y
            CW_USEDEFAULT, // WIDTH
            CW_USEDEFAULT, // HEIGHT
            null_mut(),
            null_mut(),
            hinstance,
            null_mut());

        return handle;
    }
}

unsafe extern "system" fn win32_wnd_proc(
    hwnd: HWND,
    msg: UINT,
    wparam: WPARAM,
    lparam: LPARAM) -> LRESULT {
    match msg {
        WM_CREATE => 0,
        WM_DESTROY => { PostQuitMessage(0); 0 },
        _ => DefWindowProcW(hwnd, msg, wparam, lparam)
    }
}


fn main() {
    let hwnd = create_window("winapp", "my win app");
    unsafe {
        loop {
            let mut msg = mem::MaybeUninit::<MSG>::zeroed().assume_init();
            if GetMessageW(&mut msg, hwnd, 0, 0) > 0 {
                TranslateMessage(&msg);
                DispatchMessageW(&msg);
                continue
            }
            else {
                break
            }
        }
    }
}
