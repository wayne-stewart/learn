using System;

namespace Gallery
{
    public interface IGalleryUI
    {
        void LoadPicture(string path);
        void SetBounds(int x, int y, int width, int height);
        IAsyncResult BeginInvoke(Delegate action, params object[] args);
    }
}
