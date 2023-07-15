

using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Gallery
{
    class DataModel
    {
        IGalleryUI Form;
        GallerySettings Settings;
        List<string> MediaList;
        CircularArray<int> History;
        Timer Timer;
        Random Random;
        bool AutoPlay;

        public DataModel(IGalleryUI form, GallerySettings settings)
        {
            Form = form;
            Settings = settings;
            MediaList = new List<string>();
            History = new CircularArray<int>(50);
            Random = new Random(Environment.TickCount);
            AutoPlay = false;
        }

        void StartTimer()
        {
            Timer = new Timer(
                TimerCallback, 
                null,
                System.TimeSpan.FromSeconds(10),
                System.TimeSpan.FromSeconds(10));
        }

        void StopTimer()
        {
            Timer?.Change(Timeout.Infinite, Timeout.Infinite);
            Timer?.Dispose();
            Timer = null;
        }

        void ResumeTimer()
        {
            if (AutoPlay) StartTimer();
        }

        public void ToggleAutoPlay()
        {
            if (AutoPlay)
            {
                AutoPlay = false;
                StopTimer();
            }
            else
            {
                AutoPlay = true;
                StopTimer();
                StartTimer();
            }
        }

        public void Next()
        {
            lock (MediaList)
            {
                if (MediaList.Count > 0)
                {
                    StopTimer();
                    string path;
                    if (History.PeekAtHead())
                    {
                        var index = Random.Next(MediaList.Count - 1);
                        History.Push(index);
                        path = MediaList[index];
                    }
                    else
                    {
                        path = MediaList[History.PeekForward()];
                    }
                    Form.BeginInvoke((Action<string>)Form.LoadPicture, path);
                    ResumeTimer();
                }
            }
        }

        public void Prev()
        {
            lock (MediaList)
            {
                if (MediaList.Count > 0)
                {
                    StopTimer();
                    var path = MediaList[History.PeekBack()];
                    Form.BeginInvoke((Action<string>)Form.LoadPicture, path);
                    ResumeTimer();
                }
            }
        }

        public void SetFileSource(IEnumerable<string> paths)
        {
            StopTimer();
            MediaList.Clear();
            if (!object.ReferenceEquals(paths, Settings.FileSource))
            {
                Settings.FileSource.Clear();
                Settings.FileSource.AddRange(paths);
            }
            FillMediaList(paths, Next);
        }

        void TimerCallback(object state)
        {
            Next();
        }

        bool FilterFile(string path) =>
                path.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase)
            ||  path.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase)
            ||  path.EndsWith(".png", StringComparison.OrdinalIgnoreCase);

        IEnumerable<string> EnumerateMedia(string path)
        {
            return EnumerateMedia(new[] { path });
        }

        IEnumerable<string> EnumerateMedia(IEnumerable<string> paths)
        {
            foreach(var path in paths)
            {
                var attr = File.GetAttributes(path);
                if (attr.HasFlag(FileAttributes.Directory))
                {
                    var files = Directory.EnumerateFiles(path, "*", System.IO.SearchOption.AllDirectories);
                    foreach (var file in files)
                    {
                        if (FilterFile(file))
                        {
                            yield return file;
                        }
                        else
                        {
                            continue;
                        }
                    }
                }
                else
                {
                    if (FilterFile(path))
                    {
                        yield return path;
                    }
                    else
                    {
                        continue;
                    }
                }
            }
        }

        private void FillMediaList(string path, Action firstChance)
        {
            FillMediaList(new[] { path }, firstChance);
        }

        private void FillMediaList(IEnumerable<string> paths, Action firstChance)
        {
            Task.Factory.StartNew(() => {
                var temp = new List<string>(100);
                var call_first_chance = true;

                foreach (var path in EnumerateMedia(paths))
                {
                    temp.Add(path);
                    if (temp.Count == 100)
                    {
                        lock (MediaList)
                        {
                            MediaList.AddRange(temp);
                            temp.Clear();
                            if (call_first_chance) firstChance();
                            call_first_chance = false;
                        }
                    }
                }
                if (temp.Count > 0)
                {
                    lock (MediaList)
                    {
                        MediaList.AddRange(temp);
                        if (call_first_chance) firstChance();
                        call_first_chance = false;
                    }
                }
            });

        }
    }
}