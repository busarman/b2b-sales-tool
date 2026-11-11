// Deliberately omit upstream error details: URLs may contain credentials.
export async function sendSyncAlert() {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESERVATION_EMAIL_FROM;
  const to = process.env.SYNC_ALERT_EMAIL_TO || process.env.RESERVATION_EMAIL_TO;
  if (!key || !from || !to) return "not_configured";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `b2b-sync-alert-${new Date().toISOString().slice(0, 10)}`,
      },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ from, to, subject: "B2B: требуется проверить доступ к прайсу",
        text: "Обновление B2B не подтверждено: источник прайса недоступен, не настроен или срок действия доступа истёк. Цены не выдумываются и не заменяются нулями; ранее загруженные цены нельзя считать подтверждёнными сегодня. Проверьте доступ к Яндекс Диску и при необходимости передайте новый пароль. Пароль не следует размещать в публичном портале." }),
    });
    return response.ok ? "sent" : "failed";
  } catch { return "failed"; }
}
