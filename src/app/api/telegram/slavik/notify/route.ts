import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tgbot = process.env.SLAVIK_ADMIN_TELEGRAM_BOT_TOKEN
    const chatId = body.chatId || process.env.SLAVIK_ADMIN_TELEGRAM_CHAT_ID

    console.log('body=', body)

    const message = body.message ? body.message : '<strong>test</strong>'
    console.log('message=', message)

    const ret = await fetch(
      `https://api.telegram.org/bot${tgbot}/sendMessage?chat_id=${chatId}&text=${message}&disable_web_page_preview=true&parse_mode=HTML`
    )

    console.log(ret)

    return NextResponse.json({ status: 'OK' })
  } catch (error) {
    console.error('Telegram notify error:', error);
    return NextResponse.json({ status: 'error', message: (error as Error).message }, { status: 500 });
  }
}
