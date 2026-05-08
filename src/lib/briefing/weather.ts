import type { WeatherDTO } from "./types";

const WMO_LABELS: Record<number, string> = {
  0: "晴", 1: "晴", 2: "多云", 3: "阴",
  45: "雾", 48: "雾凇",
  51: "小雨", 53: "中雨", 55: "大雨",
  61: "小雨", 63: "中雨", 65: "大雨",
  71: "小雪", 73: "中雪", 75: "大雪",
  80: "阵雨", 81: "中阵雨", 82: "大阵雨",
  95: "雷暴", 96: "冰雹雷暴", 99: "强冰雹雷暴",
};

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
let cachedWeather: WeatherDTO | null = null;
let cacheTime = 0;

async function fetchLiveWeather(): Promise<WeatherDTO> {
  const url = "https://api.open-meteo.com/v1/forecast?latitude=22.54&longitude=114.06&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=Asia/Shanghai";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
  const json = await res.json();
  const cur = json.current;

  const code = cur.weather_code as number;
  return {
    temp: cur.temperature_2m as number,
    weatherCode: code,
    weatherLabel: WMO_LABELS[code] ?? "未知",
    humidity: cur.relative_humidity_2m as number,
    windSpeed: cur.wind_speed_10m as number,
  };
}

export async function getWeather(): Promise<WeatherDTO> {
  if (cachedWeather && Date.now() - cacheTime < CACHE_TTL) return cachedWeather;
  cachedWeather = await fetchLiveWeather();
  cacheTime = Date.now();
  return cachedWeather;
}
