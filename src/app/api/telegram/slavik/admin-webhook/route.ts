import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('Incoming Telegram update for Admin:', JSON.stringify(body, null, 2));

    const message = body.message?.text;
    const chatId = body.message?.chat?.id;
    const callbackQuery = body.callback_query ? JSON.parse(body.callback_query.data) : null;

    if (!message || !chatId || !callbackQuery) {
      return NextResponse.json({ status: 'ignored' });
    }

    const TELEGRAM_BOT_TOKEN = process.env.SLAVIK_ADMIN_TELEGRAM_BOT_TOKEN;
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    if (message === '/start') {
      const text = 'started'
      await fetch(`${TELEGRAM_API_URL}?chat_id=${chatId}&text=${text}&parse_mode=HTML`)
    } else if (callbackQuery?.url) {
      await fetch(callbackQuery.url);
    }
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ status: 'error', message: (error as Error).message }, { status: 500 });
  }
}
