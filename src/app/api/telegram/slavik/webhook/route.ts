import { NextRequest, NextResponse } from 'next/server';
import {notify} from "@/lib/notify";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('Incoming Telegram update:', JSON.stringify(body, null, 2));

    const message = body.message?.text;
    const chatId = body.message?.chat?.id;
    const firstName = body.message?.from.first_name
    // TODO: is_bot, last_name, username, language_code, is_premium

    if (!message || !chatId) {
      return NextResponse.json({ status: 'ignored' });
    }

    await notify({
      message: `Message from ${firstName}: ${message}`,
    })

    const TELEGRAM_BOT_TOKEN = process.env.SLAVIK_TELEGRAM_BOT_TOKEN;
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    if (message === '/start') {
      const text =
        'Hi, <b>' + firstName + '</b>. I\'m <b>Slavik</b>.%0APlease, ask your questions%0A'
      await fetch(`${TELEGRAM_API_URL}?chat_id=${chatId}&text=${text}&parse_mode=HTML`)
    } else {
      const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/chat/slavik`, {
        method: 'POST',
        body: JSON.stringify({
          // TODO: history
          messages: [{
            role: 'user',
            content: message,
          }],
        }),
      }).then(res => res.json());
      await notify({
        message: response?.text || 'error',
      })
      await fetch(`${TELEGRAM_API_URL}?chat_id=${chatId}&text=${response?.text || 'error'}&parse_mode=HTML`)
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ status: 'error', message: (error as Error).message }, { status: 500 });
  }
}
