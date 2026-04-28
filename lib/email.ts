// Email wrapper — uses Resend if RESEND_API_KEY is set, otherwise logs to console.

interface EmailPayload {
  to: string
  subject: string
  html: string
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? 'noreply@interestmatcher.app'

  if (!apiKey) {
    console.log('[email] RESEND_API_KEY not set — would send:', payload.subject, 'to', payload.to)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: payload.to, subject: payload.subject, html: payload.html }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend error ${res.status}: ${text}`)
  }
}

export function connectionRequestEmail(senderUsername: string, recipientEmail: string) {
  return sendEmail({
    to: recipientEmail,
    subject: `${senderUsername} wants to connect on Interest Matcher`,
    html: `<p><strong>${senderUsername}</strong> sent you a connection request on Interest Matcher.</p>
           <p><a href="${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '')}/connections">View request</a></p>`,
  })
}

export function connectionAcceptedEmail(acceptorUsername: string, senderEmail: string) {
  return sendEmail({
    to: senderEmail,
    subject: `${acceptorUsername} accepted your connection request`,
    html: `<p><strong>${acceptorUsername}</strong> accepted your connection request on Interest Matcher.</p>
           <p><a href="${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '')}/messages">Start a conversation</a></p>`,
  })
}

export function newMessageEmail(senderUsername: string, recipientEmail: string, conversationId: string) {
  return sendEmail({
    to: recipientEmail,
    subject: `New message from ${senderUsername}`,
    html: `<p>You have a new message from <strong>${senderUsername}</strong> on Interest Matcher.</p>
           <p><a href="${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '')}/messages/${conversationId}">Read message</a></p>`,
  })
}
