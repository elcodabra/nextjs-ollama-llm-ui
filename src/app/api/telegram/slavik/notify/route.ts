import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tgbot = process.env.SLAVIK_ADMIN_TELEGRAM_BOT_TOKEN
    const chatId = body.chatId || process.env.SLAVIK_ADMIN_TELEGRAM_CHAT_ID
    const replyTo = body.replyTo

    console.log('body=', body)

    const message = body.message ? body.message : '<strong>test</strong>'
    console.log('message=', message)

    const TELEGRAM_API_URL = `https://api.telegram.org/bot${tgbot}/sendMessage`;

    console.log(`${TELEGRAM_API_URL}?chat_id=${chatId}${replyTo ? `&reply_to_message_id=${replyTo}` : ''}&text=${message}&disable_web_page_preview=true&parse_mode=HTML`)
    const ret = await fetch(
      `${TELEGRAM_API_URL}?chat_id=${chatId}${replyTo ? `&reply_to_message_id=${replyTo}` : ''}&text=${message}&disable_web_page_preview=true&parse_mode=HTML`
    ).then(res => res.json())

    console.log(ret);

    return NextResponse.json({ status: 'OK', data: ret });
  } catch (error) {
    console.error('Telegram notify error:', error);
    return NextResponse.json({ status: 'error', message: (error as Error).message }, { status: 500 });
  }
}
