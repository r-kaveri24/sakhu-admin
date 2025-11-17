type SlackPayload = {
  text: string;
};

export async function sendSlackAlert(message: string): Promise<void> {
  const url = process.env.ALERT_SLACK_WEBHOOK_URL;
  if (!url) return;
  try {
    const payload: SlackPayload = { text: message };
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // swallow errors to avoid cascading failures
  }
}

export async function sendEmailAlert(subject: string, text: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ALERT_EMAIL_TO;
  const from = process.env.ALERT_EMAIL_FROM;
  if (!apiKey || !to || !from) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
      }),
    });
  } catch {
    // swallow errors
  }
}

export async function sendFailureAlert(route: string, reason: string, lastErrorLogs: unknown[]): Promise<void> {
  const header = `Keep-alive failure: ${reason}`;
  const body = `${header}\n\nLast errors:\n${JSON.stringify(lastErrorLogs, null, 2)}`;
  await Promise.all([
    sendSlackAlert(`${header}\n\n${JSON.stringify(lastErrorLogs)}`),
    sendEmailAlert('Keep-alive failure', body),
  ]);
}