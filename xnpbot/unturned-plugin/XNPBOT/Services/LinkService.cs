using Newtonsoft.Json;
using Rocket.API;
using Rocket.Core.Logging;
using Rocket.Unturned.Chat;
using Rocket.Unturned.Player;
using System;
using System.Linq;
using System.Text;
using UnityEngine;
using XNPBOT.Configuration;
using XNPBOT.Models;

namespace XNPBOT.Services
{
    public class LinkService
    {
        private readonly HttpService _http;
        private readonly XNPBOTConfiguration _config;
        private readonly System.Random _random = new System.Random();

        public LinkService(HttpService http, XNPBOTConfiguration config)
        {
            _http = http;
            _config = config;
        }

        public string GenerateCode(int length)
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var builder = new StringBuilder();
            for (int i = 0; i < length; i++)
            {
                builder.Append(chars[_random.Next(chars.Length)]);
                if (i == 3 && length >= 8) builder.Append('-');
            }
            return builder.ToString();
        }

        public LinkCode CreateCodeForPlayer(UnturnedPlayer player)
        {
            var code = new LinkCode
            {
                SteamId = player.CSteamID.ToString(),
                Code = GenerateCode(_config.LinkCodeLength),
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(_config.LinkCodeExpireMinutes),
                Used = false
            };
            var payload = JsonConvert.SerializeObject(new
            {
                steamId = code.SteamId,
                code = code.Code,
                expiresAt = code.ExpiresAt
            });
            _http.PostAsync("log", payload);
            return code;
        }

        public void NotifyPlayer(UnturnedPlayer player, LinkCode code)
        {
            UnturnedChat.Say(player, $"Kodun: {code.Code} — Discord'da /link {code.Code} yaz.", Color.cyan);
            Logger.Log($"{player.CharacterName} için link kodu üretildi: {code.Code}");
        }
    }
}
