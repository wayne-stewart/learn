using System;

namespace Gallery
{
    public static class Assert
    {
        public static void AreEqual(string expected, string actual)
        {
            if (!string.Equals(expected, actual))
            {
                throw new Exception($"Expected: '{expected}' but was '{actual}'");
            }
        }
    }
}
