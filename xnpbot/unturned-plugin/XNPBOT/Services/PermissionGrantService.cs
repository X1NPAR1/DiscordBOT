using Newtonsoft.Json;
using Rocket.Core.Logging;
using System;
using System.Threading.Tasks;
using XNPBOT.Configuration;

namespace XNPBOT.Services
{
    public class PermissionGrantService
    {
        private readonly HttpService _http;
        private readonly XNPBOTConfiguration _config;

        public PermissionGrantService(HttpService http, XNPBOTConfiguration config)
        {
            _http = http;
            _config = config;
        }

        public async Task<bool> NotifyGrantAsync(string steamId, string permissionGroup, int durationHours)
        {
            var payload = new
            {
                steamId,
                permissionGroup,
                durationHours
            };
            var success = await _http.PostAsync("grantPermission", JsonConvert.SerializeObject(payload));
            if (!success)
            {
                Logger.LogWarning($"Yetki bildirimi başarısız: {steamId} {permissionGroup}");
            }
            return success;
        }
    }
}
