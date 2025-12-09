using Rocket.Core.Logging;
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using XNPBOT.Configuration;

namespace XNPBOT.Services
{
    public class HttpService
    {
        private readonly HttpClient _client = new HttpClient();
        private readonly XNPBOTConfiguration _config;

        public HttpService(XNPBOTConfiguration config)
        {
            _config = config;
        }

        public async Task<bool> PostAsync(string path, string json)
        {
            var url = $"{_config.ApiBaseUrl.TrimEnd('/')}/{path.TrimStart('/')}";
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            content.Headers.Add("x-api-secret", _config.ApiSecret);
            for (var attempt = 1; attempt <= 3; attempt++)
            {
                try
                {
                    var response = await _client.PostAsync(url, content);
                    if (response.IsSuccessStatusCode)
                    {
                        return true;
                    }
                    Logger.LogWarning($"HTTP {url} deneme {attempt} başarısız: {response.StatusCode}");
                }
                catch (Exception ex)
                {
                    Logger.LogError($"HTTP {url} deneme {attempt} hata: {ex.Message}");
                }
                await Task.Delay(1000 * attempt);
            }
            return false;
        }
    }
}
