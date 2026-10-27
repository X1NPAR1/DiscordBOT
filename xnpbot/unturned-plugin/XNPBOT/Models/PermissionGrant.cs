using System;

namespace XNPBOT.Models
{
    public class PermissionGrant
    {
        public string SteamId { get; set; }
        public string PermissionGroup { get; set; }
        public DateTime GrantedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }
}
