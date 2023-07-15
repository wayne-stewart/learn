using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Interop;

namespace Keypad
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        private enum ScreenSettings { Primary, NotPrimary, Smaller, Larger }

        private const int MAX_NUMBER_COUNT = 10;

        [DllImport("User32.dll")]
        static extern int SetForegroundWindow(IntPtr ptr);

        public MainWindow()
        {
            InitializeComponent();

            Configure();

            Position();

            UpdateDisplay();
        }

        private List<string> _colNumbers = new List<string>(MAX_NUMBER_COUNT);

        private ScreenSettings _screenSetting = ScreenSettings.Primary;

        private string _targetWindowName = "";

        private void btnSubmit_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                if (string.IsNullOrEmpty(_targetWindowName))
                    return;

                var processes = System.Diagnostics.Process.GetProcessesByName(_targetWindowName);

                if (processes.Length > 0)
                {
                    var handle = processes[0].MainWindowHandle;

                    SetForegroundWindow(handle);

                    System.Windows.Forms.SendKeys.SendWait(string.Join("", _colNumbers.ToArray()));
                }
            }
            catch(Exception ex)
            {
                System.Diagnostics.Debug.WriteLine(ex.Message);
            }
            finally
            {
                Application.Current.Shutdown();
            }
        }

        private void btnDelete_Click(object sender, RoutedEventArgs e)
        {
            if (_colNumbers.Count > 0)
                _colNumbers.RemoveAt(_colNumbers.Count - 1);

            UpdateDisplay();
        }

        private void btnCancel_Click(object sender, RoutedEventArgs e)
        {
            Application.Current.Shutdown();
        }

        private void btnNumber_Click(object sender, RoutedEventArgs e)
        {
            if (_colNumbers.Count < MAX_NUMBER_COUNT)
                _colNumbers.Add(((Button)sender).Content.ToString());

            UpdateDisplay();
        }

        /// <summary>
        /// Display a formatted phone number string
        /// </summary>
        private void UpdateDisplay()
        {
            if (_colNumbers.Count < 4)
            {
                txtDisplay.Text = string.Join("", _colNumbers.ToArray());
            }
            else if (_colNumbers.Count < 7)
            {
                txtDisplay.Text = string.Format("({0})-{1}",
                    string.Join("", _colNumbers.Take(3).ToArray()), 
                    string.Join("", _colNumbers.Skip(3).Take(3).ToArray()));
            }
            else
            {
                txtDisplay.Text = string.Format("({0})-{1}-{2}",
                    string.Join("", _colNumbers.Take(3).ToArray()),
                    string.Join("", _colNumbers.Skip(3).Take(3).ToArray()),
                    string.Join("", _colNumbers.Skip(6).Take(4).ToArray()));
            }

            // enable the submit button when full phone number has been entered
            if (_colNumbers.Count == MAX_NUMBER_COUNT)
            {
                btnSubmit.IsEnabled = true;
            }
            else
            {
                btnSubmit.IsEnabled = false;
            }
        }

        /// <summary>
        /// try to keep the window on top if it is deactivated
        /// </summary>
        private void Window_Deactivated(object sender, EventArgs e)
        {
            Topmost = true;
        }

        /// <summary>
        /// configure settings from command line arguments
        /// </summary>
        private void Configure()
        {
            var args = Environment.GetCommandLineArgs();

            var maxIndex = args.Length - 1;

            _screenSetting = ScreenSettings.Primary;

            for (var i = 1; i < args.Length; i++)
            {
                var a1 = args[i];
                var a2 = i == maxIndex ? null : args[i + 1];

                if ("/screen".Equals(a1, StringComparison.OrdinalIgnoreCase))
                {
                    if ("smaller".Equals(a2, StringComparison.OrdinalIgnoreCase))
                    {
                        _screenSetting = ScreenSettings.Smaller;
                    }
                    else if ("larger".Equals(a2, StringComparison.OrdinalIgnoreCase))
                    {
                        _screenSetting = ScreenSettings.Larger;
                    }
                    else if ("primary".Equals(a2, StringComparison.OrdinalIgnoreCase))
                    {
                        _screenSetting = ScreenSettings.Primary;
                    }
                    else if ("notprimary".Equals(a2, StringComparison.OrdinalIgnoreCase))
                    {
                        _screenSetting = ScreenSettings.NotPrimary;
                    }
                }
                else if ("/target".Equals(a1, StringComparison.OrdinalIgnoreCase))
                {
                    if (!string.IsNullOrEmpty(a2))
                    {
                        _targetWindowName = a2;
                    }
                }
                else if ("/?".Equals(a1))
                {
                    WriteHelp();
                }
            }
        }

        /// <summary>
        /// position the form in the center of a screen
        /// </summary>
        private void Position()
        {
            var screens = System.Windows.Forms.Screen.AllScreens;
            var screensOrderedBySize = screens.OrderBy(f => f.WorkingArea.Height * f.WorkingArea.Width);
            var windowHandle = new WindowInteropHelper(this).Handle;
            var currentScreen = System.Windows.Forms.Screen.FromHandle(windowHandle);
            System.Windows.Forms.Screen targetScreen = null;

            switch (_screenSetting)
            {
                case ScreenSettings.Primary:
                        targetScreen = screens.FirstOrDefault(f => f.Primary);
                    break;
                case ScreenSettings.NotPrimary:
                        targetScreen = screens.FirstOrDefault(f => !f.Primary);
                    break;
                case ScreenSettings.Larger:
                        targetScreen = screensOrderedBySize.Last();
                    break;
                case ScreenSettings.Smaller:
                        targetScreen = screensOrderedBySize.First();
                    break;
            }

            if (targetScreen == null)
            {
                targetScreen = currentScreen;
            }

            var bounds = targetScreen.Bounds;
            var ratio = this.Width / this.Height;
            this.Height = bounds.Height * 0.8;
            this.Width = this.Height * ratio;
            this.Top = (bounds.Height - this.Height) / 2 + bounds.Y;
            this.Left = (bounds.Width - this.Width) / 2 + bounds.X;
        }

        private void WriteHelp()
        {
            //Console.WriteLine();
            //Console.WriteLine("Usage: Keypad.exe /screen <screen setting> /target <window name>");
            //Console.WriteLine("/screen options: larger, smaller, primary, notprimary");
            //Console.WriteLine("/target parameter should be the name of the");
            //Console.WriteLine("        window to receive the simulated keystrokes.");

            //Application.Current.Shutdown();

            grdKeypad.ColumnDefinitions.Clear();
            grdKeypad.RowDefinitions.Clear();
            grdKeypad.Children.Clear();
            var stackPanel = new StackPanel();
            grdKeypad.Children.Add(stackPanel);
            stackPanel.Children.Add(new TextBlock
            {
                Text = "Usage:",
                FontWeight = FontWeights.Bold,
                FontSize = 40
            });
            stackPanel.Children.Add(new TextBlock
            {
                FontSize = 20,
                TextWrapping = TextWrapping.Wrap,
                Text = 
                    "Usage: Keypad /screen <screen setting> /target <window name>\r\n\r\n"+
                    "/screen options: larger, smaller, primary, notprimary\r\n\r\n" +
                    "/target parameter should be the name of the window to receive the simulated keystrokes."
            });
        }
    }
}
