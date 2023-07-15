namespace Gallery
{
    public enum HitSpot : uint
    {
        None        = 0,
        Move        = 1,
        North       = 1 << 1,
        East        = 1 << 2,
        South       = 1 << 3,
        West        = 1 << 4,
        NorthEast   = 1 << 5,
        NorthWest   = 1 << 6,
        SouthEast   = 1 << 7,
        SouthWest   = 1 << 8,
        Resize      = North | East | South | West | NorthEast | NorthWest | SouthEast | SouthWest,
        Next        = 1 << 9,
        Prev        = 1 << 10
    }

    public static class HitSpotExtensions
    {
        public static bool IsResize(this HitSpot hit) => ((uint)hit & (uint)HitSpot.Resize) > 1;
    }
}
