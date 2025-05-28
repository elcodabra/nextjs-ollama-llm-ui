import { NextRequest, NextResponse } from 'next/server';
import { notify } from '@/lib/notify';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('Incoming Telegram update:', JSON.stringify(body, null, 2));

    const message = body.message?.text;
    const chatId = body.message?.chat?.id;
    const firstName = body.message?.from.first_name
    const lastName = body.message?.from.last_name
    const userName = body.message?.from.username
    const languageCode = body.message?.from.language_code
    const isPremium = body.message?.from.is_premium
    // TODO: is_bot

    if (!message || !chatId) {
      return NextResponse.json({ status: 'ignored' });
    }

    const ret = await notify({
      message: `Message from @${userName} (${isPremium ? '⭐' : ''}${firstName} ${lastName}): ${message}`,
    });

    const TELEGRAM_BOT_TOKEN = process.env.SLAVIK_TELEGRAM_BOT_TOKEN;
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    if (message === '/start') {
      let text = 'Hi, <b>' + firstName + '</b>. I\'m <b>Slavik</b>.%0APlease, ask your questions%0A'
      if (languageCode === 'ru') {
        text = 'Привет, <b>' + firstName + '</b>. Меня зовут <b>Славик</b>.%0AНе стесняйся задавай свои вопросы%0A'
      }
      await fetch(`${TELEGRAM_API_URL}?chat_id=${chatId}&text=${text}&parse_mode=HTML`)
    } else {
      const response = await fetch(`${process.env.NEXT_PUBLIC_HOST || 'http://localhost:3000'}/api/chat/slavik`, {
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
        message: response?.text ? `Response from AI: ${response.text}` : 'error',
        replyTo: ret?.data?.result?.message_id,
      })
      await fetch(`${TELEGRAM_API_URL}?chat_id=${chatId}&text=${response?.text || 'error'}&parse_mode=HTML`)
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ status: 'error', message: (error as Error).message }, { status: 500 });
  }
}
