using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Security.AccessControl;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Gallery
{
    public partial class MainForm : Form, IGalleryUI
    {
        DataModel Model;
        Image Picture;

        const int CURSOR_MARGIN = 10;
        GallerySettings Settings;

        bool IsResizing = false;
        bool IsMoving = false;
        bool IsPanning = false;
        bool WinKeyPressed = false;
        bool IsFullScreen = false;
        DateTime LastFocusStamp = DateTime.MinValue;
        Point LastMouseDown;
        Point LastWindowPos;
        Size LastWindowSize;
        int PanX, PanY;
        HitSpot Hit;

        public MainForm()
        {
            InitializeComponent();

            Settings = new GallerySettings(this);

            Model = new DataModel(this, Settings);

            AllowDrop = true;
            Paint += Handle_Paint;
            DragEnter += Handle_DragEnter;
            DragDrop += Handle_DragDrop;
            Resize += Handle_Resize;
            Move += Handle_Move;
            MouseDown += Handle_MouseDown;
            MouseUp += Handle_MouseUp;
            MouseWheel += Handle_MouseWheel;
            MouseMove += Handle_MouseMove;
            KeyDown += Handle_KeyDown;
            KeyUp += Handle_KeyUp;
            FormClosing += Handle_FormClosing;
            Load += Handle_Load;
            GotFocus += Handle_GotFocus;
        }

        public void LoadPicture(string path)
        {
            Image picture = null;
            try
            {
                picture = Image.FromFile(path);
            }
            catch(Exception ex)
            {
                picture?.Dispose();
                picture = null;
                var slog = path + Environment.NewLine + ex.Message;
                Debug.WriteLine(slog);
            }

            PanX = PanY = 0;
            if (picture != null)
            {
                Picture?.Dispose();
                Picture = picture;
            }
            Invalidate();
        }

        private void Handle_Load(object sender, EventArgs e)
        {
            Settings.LoadSettings();

            if (Settings.FileSource.Count == 0)
            {
                Model.SetFileSource(new []{ Environment.GetFolderPath(Environment.SpecialFolder.MyPictures) });
            }
            else
            {
                Model.SetFileSource(Settings.FileSource);
            }
        }

        private void Handle_FormClosing(object sender, FormClosingEventArgs e)
        {
            Settings.SaveSettings();
        }

        private void Handle_GotFocus(object sender, EventArgs e)
        {
            LastFocusStamp = DateTime.Now;
        }

        private void Handle_Move(object sender, EventArgs e)
        {
            UpdateSettingDimensions();
        }

        private void Handle_Resize(object sender, EventArgs e)
        {
            PanX = PanY = 0;
            Invalidate();
            UpdateSettingDimensions();
        }

        private void Handle_MouseUp(object sender, MouseEventArgs e)
        {
            if (DateTime.Now.Subtract(LastFocusStamp).TotalMilliseconds < 1000) return;

            if (e.Button == MouseButtons.Left)
            {
                if (IsResizing || IsMoving)
                {
                    IsResizing = IsMoving = false;
                }
                else if (Hit == HitSpot.Next)
                {
                    Model.Next();
                }
                else if (Hit == HitSpot.Prev)
                {
                    Model.Prev();
                }
            }
            else if (e.Button == MouseButtons.Middle)
            {
                Model.ToggleAutoPlay();
            }
            else if (e.Button == MouseButtons.Right)
            {
                IsPanning = false;
            }
        }

        private void Handle_MouseDown(object sender, MouseEventArgs e)
        {
            if (DateTime.Now.Subtract(LastFocusStamp).TotalMilliseconds < 1000) return;

            LastMouseDown = PointToScreen(e.Location);
            LastWindowPos = Location;
            LastWindowSize = Size;
            Hit = HitTest(e);

            if (e.Button == MouseButtons.Left)
            {
                if (Hit == HitSpot.Move)
                {
                    IsMoving = true;
                }
                else if (Hit.IsResize())
                {
                    IsResizing = true;
                }
            }
            else if (e.Button == MouseButtons.Right)
            {
                IsPanning = true;
            }
        }

        private void Handle_MouseWheel(object sender, MouseEventArgs e)
        {
            if (DateTime.Now.Subtract(LastFocusStamp).TotalMilliseconds < 1000) return;

            if (Settings.PaintMode == PaintModes.Fit)
                Settings.PaintMode = PaintModes.Fill;
            else
                Settings.PaintMode = PaintModes.Fit;

            Invalidate();
        }

        private void Handle_MouseMove(object sender, MouseEventArgs e)
        {
            int dx, dy;
            if (IsResizing || IsMoving)
            {
                var screen_coords = PointToScreen(e.Location);
                dx = screen_coords.X - LastMouseDown.X;
                dy = screen_coords.Y - LastMouseDown.Y;
                switch (Hit)
                {
                    case HitSpot.North:
                        if (IsResizing) UpdateDimensions(LastWindowPos.X, LastWindowPos.Y + dy, LastWindowSize.Width, LastWindowSize.Height - dy);
                        break;
                    case HitSpot.NorthEast:
                        if (IsResizing) UpdateDimensions(LastWindowPos.X, LastWindowPos.Y + dy, LastWindowSize.Width + dx, LastWindowSize.Height - dy);
                        break;
                    case HitSpot.East:
                        if (IsResizing) UpdateDimensions(LastWindowPos.X, LastWindowPos.Y, LastWindowSize.Width + dx, LastWindowSize.Height);
                        break;
                    case HitSpot.SouthEast:
                        if (IsResizing) UpdateDimensions(LastWindowPos.X, LastWindowPos.Y, LastWindowSize.Width + dx, LastWindowSize.Height + dy);
                        break;
                    case HitSpot.South:
                        if (IsResizing) UpdateDimensions(LastWindowPos.X, LastWindowPos.Y, LastWindowSize.Width, LastWindowSize.Height + dy);
                        break;
                    case HitSpot.SouthWest:
                        if (IsResizing) UpdateDimensions(LastWindowPos.X + dx, LastWindowPos.Y, LastWindowSize.Width - dx, LastWindowSize.Height + dy);
                        break;
                    case HitSpot.West:
                        if (IsResizing) UpdateDimensions(LastWindowPos.X + dx, LastWindowPos.Y, LastWindowSize.Width - dx, Height);
                        break;
                    case HitSpot.NorthWest:
                        if (IsResizing) UpdateDimensions(LastWindowPos.X + dx, LastWindowPos.Y + dy, LastWindowSize.Width - dx, LastWindowSize.Height - dy);
                        break;
                    case HitSpot.Move:
                        if (IsMoving) UpdateDimensions(LastWindowPos.X + dx, LastWindowPos.Y + dy, LastWindowSize.Width, LastWindowSize.Height);
                        break;
                }
            }
            else if (IsPanning)
            {
                var screen_coords = PointToScreen(e.Location);
                dx = screen_coords.X - LastMouseDown.X;
                dy = screen_coords.Y - LastMouseDown.Y;
                LastMouseDown = screen_coords;
                PanX += dx;
                PanY += dy;
                //Debug.WriteLine($"dx: {dx}, dy: {dy}, PanX: {PanX} PanY: {PanY}");
                Invalidate();
            }
            else
            {
                HitTest(e);
            }

           // Win32.SendMessage(Handle, Win32.WM_SETREDRAW, false, 0);

            //Win32.SendMessage(Handle, Win32.WM_SETREDRAW, true, 0);
        }

        private void Handle_DragEnter(object sender, DragEventArgs e)
        {
            if (e.Data.GetDataPresent(DataFormats.FileDrop))
            {
                e.Effect = DragDropEffects.Move;
            }
        }

        private void Handle_DragDrop(object sender, DragEventArgs e)
        {
            if (e.Data.GetDataPresent(DataFormats.FileDrop))
            {
                var drop_files = e.Data.GetData(DataFormats.FileDrop) as string[];
                if (drop_files != null)
                {
                    Model.SetFileSource(drop_files);
                }
            }
        }

        private void Handle_Paint(object sender, PaintEventArgs e)
        {
            if (Picture == null)
            {
                e.Graphics.FillRectangle(Brushes.DarkGray, e.ClipRectangle);
            }
            else
            {
                Rectangle dst_rect;
                if (Settings.PaintMode == PaintModes.Fill)
                {
                    dst_rect = Resize_Fill(Picture.Width, Picture.Height, ClientRectangle);
                    var width_diff = Math.Abs(ClientRectangle.Width - dst_rect.Width)/2;
                    var height_diff = Math.Abs(ClientRectangle.Height - dst_rect.Height)/2;
                    PanX = Clamp(PanX, -width_diff, width_diff);
                    PanY = Clamp(PanY, -height_diff, height_diff);
                    dst_rect.X += PanX;
                    dst_rect.Y += PanY;
                }
                else
                {
                    dst_rect = Resize_Fit(Picture.Width, Picture.Height, ClientRectangle);
                }
                e.Graphics.FillRectangle(Brushes.Black, ClientRectangle);
                e.Graphics.CompositingMode = System.Drawing.Drawing2D.CompositingMode.SourceCopy;
                e.Graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                e.Graphics.DrawImage(Picture, dst_rect, 0, 0, Picture.Width, Picture.Height, GraphicsUnit.Pixel);
            }
        }

        private void Handle_KeyDown(object sender, KeyEventArgs e)
        {
            switch(e.KeyCode)
            {
                case Keys.LWin:
                case Keys.RWin:
                    WinKeyPressed = true;
                    break;
            }
        }

        private void Handle_KeyUp(object sender, KeyEventArgs e)
        {
            switch (e.KeyCode)
            {
                case Keys.F11:
                    ToggleFullScreen();
                    break;
                case Keys.Space:
                    Model.Next();
                    break;
                case Keys.Escape:
                    Application.Exit();
                    break;
                case Keys.LWin:
                case Keys.RWin:
                    WinKeyPressed = false;
                    break;
                case Keys.Left:
                    if (WinKeyPressed) SnapLeft();
                    break;
                case Keys.Right:
                    if (WinKeyPressed) SnapRight();
                    break;
            }
        }

        private HitSpot HitTest(MouseEventArgs e)
        {
            var left_margin = e.X < CURSOR_MARGIN;
            var right_margin = e.X > (Size.Width - CURSOR_MARGIN);
            var top_margin = e.Y < CURSOR_MARGIN;
            var bottom_margin = e.Y > (Size.Height - CURSOR_MARGIN);
            var move_sector = e.Y < (Size.Height * 0.2); // top 20% is move sector
            var next_sector = e.X > (Size.Width / 2);
            var prev_sector = e.X < (Size.Width / 2);
            HitSpot mode;

            if (!Focused)
            {
                mode = HitSpot.None;
                Cursor = Cursors.Default;
            }
            else if (left_margin && top_margin)
            {
                mode = HitSpot.NorthWest;
                Cursor = Cursors.SizeNWSE;
            }
            else if (right_margin && bottom_margin)
            {
                mode = HitSpot.SouthEast;
                Cursor = Cursors.SizeNWSE;
            }
            else if (left_margin && bottom_margin)
            {
                mode = HitSpot.SouthWest;
                Cursor = Cursors.SizeNESW;
            }
            else if (right_margin && top_margin)
            {
                mode = HitSpot.NorthEast;
                Cursor = Cursors.SizeNESW;
            }
            else if (left_margin)
            {
                mode = HitSpot.West;
                Cursor = Cursors.SizeWE;
            }
            else if (right_margin)
            {
                mode = HitSpot.East;
                Cursor = Cursors.SizeWE;
            }
            else if (top_margin)
            {
                mode = HitSpot.North;
                Cursor = Cursors.SizeNS;
            }
            else if (bottom_margin)
            {
                mode = HitSpot.South;
                Cursor = Cursors.SizeNS;
            }
            else if (move_sector)
            {
                mode = HitSpot.Move;
                Cursor = Cursors.SizeAll;
            }
            else if (next_sector)
            {
                mode = HitSpot.Next;
                Cursor = Cursors.PanEast;
            }
            else if (prev_sector)
            {
                mode = HitSpot.Prev;
                Cursor = Cursors.PanWest;
            }
            else
            {
                mode = HitSpot.None;
                Cursor = Cursors.Default;
            }

            return mode;
        }

        private Rectangle Resize_Fit(float src_width, float src_height, Rectangle bounds)
        {
            float src_aspect = src_width / src_height;
            float cnt_aspect = (float)bounds.Width / bounds.Height;
            float target_width;
            float target_height;
            int target_x;
            int target_y;
            if (src_aspect > cnt_aspect)
            {
                target_width = bounds.Width;
                target_height = (int)(target_width / src_aspect);
                target_x = 0;
                target_y = (int)((bounds.Height - target_height) / 2);
            }
            else
            {
                target_height = bounds.Height;
                target_width = (int)(target_height * src_aspect);
                target_x = (int)((bounds.Width - target_width) / 2);
                target_y = 0;
            }

            return new Rectangle(target_x, target_y, (int)target_width, (int)target_height);
        }

        private Rectangle Resize_Fill(float src_width, float src_height, Rectangle bounds)
        {
            float src_aspect = src_width / src_height;
            float cnt_aspect = (float)bounds.Width / bounds.Height;
            float target_width;
            float target_height;
            int target_x;
            int target_y;
            if (src_aspect > cnt_aspect)
            {
                target_height = bounds.Height;
                target_width = (int)(target_height * src_aspect);
                target_x = (int)((bounds.Width - target_width) / 2);
                target_y = 0;
            }
            else
            {
                target_width = bounds.Width;
                target_height = (int)(target_width / src_aspect);
                target_x = 0;
                target_y = (int)((bounds.Height - target_height) / 2);
            }

            return new Rectangle(target_x, target_y, (int)target_width, (int)target_height);
        }

        private void SnapLeft()
        {
            var working_area = Screen.GetWorkingArea(this);
            if (Left == working_area.Left)
            {
                var screen_to_the_left = Screen.AllScreens.Where(s => s.WorkingArea.Right <= working_area.Left).OrderByDescending(s => s.WorkingArea.Right).FirstOrDefault();
                if (screen_to_the_left != null)
                {
                    var a = screen_to_the_left.WorkingArea;
                    SetBounds(a.X + (a.Width / 2), a.Y, a.Width / 2, a.Height);
                }
            }
            else
            {
                SetBounds(working_area.X, working_area.Y, working_area.Width / 2, working_area.Height);
            }

        }

        private void SnapRight()
        {
            var working_area = Screen.GetWorkingArea(this);
            if (Right == working_area.Right)
            {
                var screen_to_the_right = Screen.AllScreens.Where(s => s.WorkingArea.Left >= working_area.Right).OrderBy(s => s.WorkingArea.Left).FirstOrDefault();
                if (screen_to_the_right != null)
                {
                    var a = screen_to_the_right.WorkingArea;
                    SetBounds(a.Left, a.Top, a.Width / 2, a.Height);
                }
            }
            else
            {
                SetBounds(working_area.X + (working_area.Width / 2), working_area.Y, working_area.Width / 2, working_area.Height);
            }
        }

        private void ToggleFullScreen()
        {
            IsFullScreen = !IsFullScreen;
            if (IsFullScreen)
            {
                var working_area = Screen.GetWorkingArea(this);
                Bounds = working_area;
            }
            else
            {
                SetBounds(Settings.X, Settings.Y, Settings.Width, Settings.Height);
            }
        }

        private void UpdateDimensions(int x, int y, int width, int height)
        {
            SetBounds(x, y, width, height);
        }

        private void UpdateSettingDimensions()
        {
            if (!IsFullScreen)
            {
                Settings.X = Left;
                Settings.Y = Top;
                Settings.Width = Width;
                Settings.Height = Height;
            }
        }

        private int Clamp(int value, int min, int max)
        {
            if (value < min)
            {
                return min;
            }
            else if (value > max)
            {
                return max;
            }
            return value;
        }
    }
}
