using Rocket.API;
using Rocket.Core.Logging;
using Rocket.Core.Plugins;
using Rocket.Unturned;
using System.Reflection;
using XNPBOT.Configuration;
using XNPBOT.Services;

namespace XNPBOT
{
    public class Main : RocketPlugin<XNPBOTConfiguration>
    {
        public static Main Instance { get; private set; }
        public HttpService HttpService { get; private set; }
        public LogForwardingService LogForwardingService { get; private set; }
        public PermissionGrantService PermissionGrantService { get; private set; }
        public LinkService LinkService { get; private set; }

        protected override void Load()
        {
            Instance = this;
            Logger.Log($"XNPBOT v{Assembly.GetName().Version} yükleniyor...");
            HttpService = new HttpService(Configuration.Instance);
            LogForwardingService = new LogForwardingService(HttpService, Configuration.Instance);
            PermissionGrantService = new PermissionGrantService(HttpService, Configuration.Instance);
            LinkService = new LinkService(HttpService, Configuration.Instance);

            U.Events.OnPlayerConnected += LogForwardingService.OnPlayerConnected;
            U.Events.OnPlayerDisconnected += LogForwardingService.OnPlayerDisconnected;

            Logger.Log("XNPBOT başarıyla yüklendi.");
        }

        protected override void Unload()
        {
            U.Events.OnPlayerConnected -= LogForwardingService.OnPlayerConnected;
            U.Events.OnPlayerDisconnected -= LogForwardingService.OnPlayerDisconnected;
            Logger.Log("XNPBOT kapatıldı.");
        }
    }
}
