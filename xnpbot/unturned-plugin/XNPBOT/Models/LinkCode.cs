using System;

namespace XNPBOT.Models
{
    public class LinkCode
    {
        public string SteamId { get; set; }
        public string Code { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool Used { get; set; }
    }
}
