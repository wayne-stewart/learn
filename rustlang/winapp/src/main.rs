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
            HBRUSH,
            HMENU
        },
        minwindef::{
            LRESULT,
            LPARAM,
            WPARAM,
            UINT,
            HINSTANCE
        },
        ntdef::{
            LONG,
            NULL
        }
    },
    um::{
        consoleapi::{
            AllocConsole
        },
        libloaderapi::{
            GetModuleHandleW,
        },
        wingdi::{
            GetStockObject,
            WHITE_BRUSH
        },
        commctrl::{
            INITCOMMONCONTROLSEX,
            InitCommonControlsEx,
            ICC_BAR_CLASSES
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
            GetWindowLongPtrW,
            GWLP_HINSTANCE,

            // CreateWindow
            WS_OVERLAPPEDWINDOW,
            WS_VISIBLE,
            WS_CHILD,
            WS_BORDER,
            ES_LEFT,
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
            COLOR_WINDOW,
        }
    }
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
            hCursor: LoadCursorW(null_mut(), IDC_ARROW),
            hbrBackground: white_brush as HBRUSH,
            lpszMenuName: null_mut()
        };

        RegisterClassW(&wnd_class);

        let handle = CreateWindowExW(
            0, // dwExStyle - Extended Window Style
            name.as_ptr(), // lpClassName
            title.as_ptr(), // lpWindowName
            WS_OVERLAPPEDWINDOW | WS_VISIBLE, // dwStyle
            CW_USEDEFAULT, // X
            CW_USEDEFAULT, // Y
            300, // CW_USEDEFAULT, // WIDTH
            200, //CW_USEDEFAULT, // HEIGHT
            null_mut(), // hwndParent
            null_mut(), // hMenu
            hinstance,  // hInstance
            null_mut()); // lParam

        return handle;
    }
}

fn create_textbox(parent_hwnd: HWND, control_id: u32) -> HWND {
    unsafe {
    let hwnd = CreateWindowExW(
        0,
        win32_string("EDIT").as_ptr(),
        null_mut(),
        WS_BORDER | WS_CHILD | WS_VISIBLE | ES_LEFT,
        5, 5, // x,y
        50, 30, // w, h
        parent_hwnd,
        control_id as HMENU, //ID_EDITCHILD as HMENU,
        GetWindowLongPtrW(parent_hwnd, GWLP_HINSTANCE) as HINSTANCE,
        null_mut());
    hwnd
    }
}

unsafe extern "system" fn win32_wnd_proc(
    hwnd: HWND,
    msg: UINT,
    wparam: WPARAM,
    lparam: LPARAM) -> LRESULT {
    match msg {
        WM_CREATE => {
            let _ = create_textbox(hwnd, EDIT_CONTROL_ID);
            0
        },
        WM_DESTROY => { PostQuitMessage(0); 0 },
        _ => DefWindowProcW(hwnd, msg, wparam, lparam)
    }
}

static EDIT_CONTROL_ID: u32 = 10;

fn main() {
    //unsafe { AllocConsole(); }
    let icc = INITCOMMONCONTROLSEX {
       dwSize: std::mem::size_of::<INITCOMMONCONTROLSEX>() as u32,
       dwICC: ICC_BAR_CLASSES
    };
    let hwnd = create_window("winapp", "my win app");
    unsafe {
        InitCommonControlsEx(&icc);
        let mut msg = mem::MaybeUninit::<MSG>::zeroed().assume_init();
        loop {
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
