using Newtonsoft.Json;
using Rocket.Unturned.Player;
using System.Threading.Tasks;
using XNPBOT.Configuration;

namespace XNPBOT.Services
{
    public class LogForwardingService
    {
        private readonly HttpService _http;
        private readonly XNPBOTConfiguration _config;

        public LogForwardingService(HttpService http, XNPBOTConfiguration config)
        {
            _http = http;
            _config = config;
        }

        public async void OnPlayerConnected(UnturnedPlayer player)
        {
            var payload = new
            {
                type = "player_join",
                steamId = player.CSteamID.ToString(),
                characterName = player.CharacterName,
                server = _config.ServerName
            };
            await _http.PostAsync("log", JsonConvert.SerializeObject(payload));
        }

        public async void OnPlayerDisconnected(UnturnedPlayer player)
        {
            var payload = new
            {
                type = "player_leave",
                steamId = player.CSteamID.ToString(),
                characterName = player.CharacterName,
                server = _config.ServerName
            };
            await _http.PostAsync("log", JsonConvert.SerializeObject(payload));
        }
    }
}
