interface Body {
  chatId?: string
  message: string
}

export async function notify(body: Body) {
  const res = await fetch((process.env.NEXT_PUBLIC_HOST || '') + '/api/telegram/slavik/notify', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return res.json()
}
