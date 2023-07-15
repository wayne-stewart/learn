using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace Gallery.Win32
{
    public static class User32
    {
        public const int WM_SETREDRAW = 11;
        public const int NCPAINT = 0x85;


        [DllImport("user32.dll")]
        public static extern int SendMessage(IntPtr hWnd, Int32 wMsg, bool wParam, Int32 lParam);

        public enum D2D1_FACTORY_TYPE
        {
            D2D1_FACTORY_TYPE_SINGLE_THREADED = 0,
            D2D1_FACTORY_TYPE_MULTI_THREADED = 1
        }
    }

    //public static class Direct3D
    //{
    //    public const int D3D11_SDK_VERSION = 7;

    //    public enum D3D_DRIVER_TYPE
    //    {
    //        D3D_DRIVER_TYPE_UNKNOWN = 0,
    //        D3D_DRIVER_TYPE_HARDWARE = (D3D_DRIVER_TYPE_UNKNOWN + 1),
    //        D3D_DRIVER_TYPE_REFERENCE = (D3D_DRIVER_TYPE_HARDWARE + 1),
    //        D3D_DRIVER_TYPE_NULL = (D3D_DRIVER_TYPE_REFERENCE + 1),
    //        D3D_DRIVER_TYPE_SOFTWARE = (D3D_DRIVER_TYPE_NULL + 1),
    //        D3D_DRIVER_TYPE_WARP = (D3D_DRIVER_TYPE_SOFTWARE + 1)
    //    }
    //    public enum D3D_FEATURE_LEVEL
    //    {
    //        D3D_FEATURE_LEVEL_1_0_CORE = 0x1000,
    //        D3D_FEATURE_LEVEL_9_1 = 0x9100,
    //        D3D_FEATURE_LEVEL_9_2 = 0x9200,
    //        D3D_FEATURE_LEVEL_9_3 = 0x9300,
    //        D3D_FEATURE_LEVEL_10_0 = 0xa000,
    //        D3D_FEATURE_LEVEL_10_1 = 0xa100,
    //        D3D_FEATURE_LEVEL_11_0 = 0xb000,
    //        D3D_FEATURE_LEVEL_11_1 = 0xb100,
    //        D3D_FEATURE_LEVEL_12_0 = 0xc000,
    //        D3D_FEATURE_LEVEL_12_1 = 0xc100
    //    }

    //    [DllImport("d3d11.dll")]
    //    public static extern uint D3D11CreateDevice(
    //        IntPtr ptr_adapter,                // Specify nullptr to use the default adapter.
    //        D3D_DRIVER_TYPE driver_type,   // Create a device using the hardware graphics driver.
    //        uint software_driver,                          // Should be 0 unless the driver is D3D_DRIVER_TYPE_SOFTWARE.
    //        uint flags,                // Set debug and Direct2D compatibility flags.
    //        D3D_FEATURE_LEVEL[] levels,                     // List of feature levels this app can support.
    //        uint level_count,          // Size of the list above.
    //        uint sdk_version,          // Always set this to D3D11_SDK_VERSION for Windows Store apps.
    //        out ID3D11Device device,                    // Returns the Direct3D device created.
    //        &m_featureLevel,            // Returns feature level of device created.
    //        &context                    // Returns the device immediate context.
    //        );
    //}
}
