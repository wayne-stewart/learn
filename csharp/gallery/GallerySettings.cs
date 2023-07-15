using System;
using System.Collections.Generic;
using System.IO;
using System.Diagnostics;
using System.Linq;

namespace Gallery
{
    public class GallerySettings
    {
        readonly string SETTINGS_PATH = System.IO.Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Gallery", "settings.txt");

        public IGalleryUI Form;
        public int X = 0;
        public int Y = 0;
        public int Width = 800;
        public int Height = 600;
        public PaintModes PaintMode = PaintModes.Fill;
        public List<string> FileSource = new List<string>();

        public GallerySettings(IGalleryUI form)
        {
            Form = form;
        }

        public void SaveSettings()
        {
            var file_info = new FileInfo(SETTINGS_PATH);
            if (!file_info.Directory.Exists)
                file_info.Directory.Create();
            using (var file = File.Open(file_info.FullName, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                using (var writer = new StreamWriter(file))
                {
                    writer.WriteLine(nameof(X));
                    writer.WriteLine(X);
                    writer.WriteLine(nameof(Y));
                    writer.WriteLine(Y);
                    writer.WriteLine(nameof(Width));
                    writer.WriteLine(Width);
                    writer.WriteLine(nameof(Height));
                    writer.WriteLine(Height);
                    writer.WriteLine(nameof(PaintMode));
                    writer.WriteLine(PaintMode);
                    writer.WriteLine(nameof(FileSource));
                    foreach(var path in FileSource)
                    {
                        writer.WriteLine(path);
                    }
                    writer.Flush();
                    file.Flush();
                }
            }
        }

        public void LoadSettings()
        {
            var p = new [] { 
                new { Field = nameof(X),            Action = (Action<string>)(s => X = int.Parse(s)) }, 
                new { Field = nameof(Y),            Action = (Action<string>)(s => Y = int.Parse(s)) },
                new { Field = nameof(Width),        Action = (Action<string>)(s => Width = int.Parse(s)) },
                new { Field = nameof(Height),       Action = (Action<string>)(s => Height = int.Parse(s)) },
                new { Field = nameof(PaintMode),    Action = (Action<string>)(s => PaintMode = Enum.Parse<PaintModes>(s)) }
            };

            var file_info = new FileInfo(SETTINGS_PATH);
            if (file_info.Exists)
            {
                try
                {
                    using (var file = file_info.OpenRead())
                    {
                        using (var reader = new StreamReader(file))
                        {
                            while(!reader.EndOfStream)
                            {
                                var field_name = reader.ReadLine();
                                if (field_name == nameof(FileSource))
                                {
                                    while(!reader.EndOfStream)
                                    {
                                        var path = reader.ReadLine();
                                        if (!string.IsNullOrWhiteSpace(path))
                                        {
                                            FileSource.Add(path);
                                        }
                                    }
                                }
                                else
                                {
                                    var value = reader.ReadLine();
                                    p.SingleOrDefault(x => x.Field == field_name)?.Action(value);
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Debug.WriteLine(ex.Message);
                }
            }
            Form.SetBounds(X, Y, Width, Height);
        }
    }
}
