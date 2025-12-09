using Rocket.API;
using System.Collections.Generic;
using System.Xml.Serialization;

namespace XNPBOT.Configuration
{
    public class XNPBOTConfiguration : IRocketPluginConfiguration
    {
        public string ApiBaseUrl { get; set; } = "http://127.0.0.1:3000/api";
        public string ApiSecret { get; set; } = "change-me";
        public string ServerName { get; set; } = "XNP Unturned";
        public string ServerIp { get; set; } = "127.0.0.1";
        public ushort ServerPort { get; set; } = 27015;
        public ulong StatusChannelId { get; set; }
        public ulong StatusMessageId { get; set; }
        public int LinkCodeLength { get; set; } = 8;
        public int LinkCodeExpireMinutes { get; set; } = 15;

        [XmlArrayItem(ElementName = "Channel")]
        public List<DiscordLogChannelDefinition> LogChannels { get; set; } = new List<DiscordLogChannelDefinition>();

        public void LoadDefaults()
        {
            ApiBaseUrl = "http://127.0.0.1:3000/api";
            ApiSecret = "change-me";
            ServerName = "XNP Unturned";
            ServerIp = "127.0.0.1";
            ServerPort = 27015;
            StatusChannelId = 0;
            StatusMessageId = 0;
            LinkCodeLength = 8;
            LinkCodeExpireMinutes = 15;
            LogChannels = new List<DiscordLogChannelDefinition>
            {
                new DiscordLogChannelDefinition { Name = "join-log", ChannelId = 0 },
                new DiscordLogChannelDefinition { Name = "ban-log", ChannelId = 0 }
            };
        }
    }
}
