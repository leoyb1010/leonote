export async function sendTelegramReminder(chatId: string, text: string) {
  const token = process.env.TG_BOT_TOKEN;
  if (!token) throw new Error("TG_BOT_TOKEN is required");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`telegram-send-failed:${response.status}:${body.slice(0, 120)}`);
  }
}
