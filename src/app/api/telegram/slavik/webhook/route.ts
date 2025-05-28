import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('Incoming Telegram update:', JSON.stringify(body, null, 2));

    const message = body.message?.text;
    const chatId = body.message?.chat?.id;

    if (!message || !chatId) {
      return NextResponse.json({ status: 'ignored' });
    }

    // TODO: send message to admin bot and group

    const TELEGRAM_BOT_TOKEN = process.env.SLAVIK_TELEGRAM_BOT_TOKEN;
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    if (message === '/start') {
      const response =
        'Hi, <b>' +
        body.message.from.first_name +
        '</b>I\'m <i>Slavik</i>.%0APlease, ask your questions%0A'
      await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${chatId}&text=${response}&parse_mode=HTML`
      )
    } else {
      const response =
        'Help for <i>S-HUB.world News Channel</i>.%0AUse /search <i>keyword</i> to search for <i>keyword</i> in my Medium publication'
      const ret = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${chatId}&text=${response}&parse_mode=HTML`
      )
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ status: 'error', message: (error as Error).message }, { status: 500 });
  }
}
