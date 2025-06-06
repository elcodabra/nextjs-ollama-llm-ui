import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tgbot = process.env.SLAVIK_ADMIN_TELEGRAM_BOT_TOKEN
    const chatId = body.chatId || process.env.SLAVIK_ADMIN_TELEGRAM_CHAT_ID
    const replyTo = body.replyTo
    const replyMarkup = body.replyMarkup

    console.log('body=', JSON.stringify(body, null, 2))

    const message = body.message ? body.message : '<strong>test</strong>'
    console.log('message=', message)

    const TELEGRAM_API_URL = `https://api.telegram.org/bot${tgbot}/sendMessage`;

    // TODO: generate response from ai
    console.log('chatId=', chatId);

    const ret = await fetch(TELEGRAM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          // text: replyTo ? `Response from AI: ${message}` : message,
          text: message,
          ...replyTo ? { reply_to_message_id: replyTo } : {},
          disable_web_page_preview: true,
          parse_mode: 'HTML',
          ...replyMarkup ? { reply_markup: replyMarkup } : {},
        }),
      }
    ).then(res => res.json())

    console.log('notify response = ', ret);

    return NextResponse.json({ status: 'OK', data: ret });
  } catch (error) {
    console.error('Telegram notify error:', error);
    return NextResponse.json({ status: 'error', message: (error as Error).message }, { status: 500 });
  }
}
