import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('Incoming Telegram update for Admin:', JSON.stringify(body, null, 2));

    const message = body.message?.text;
    const chatId = body.message?.chat?.id;
    const callbackQuery = body.callback_query ? JSON.parse(body.callback_query.data) : null;

    if ((!message || !chatId) && !callbackQuery) {
      return NextResponse.json({ status: 'ignored' });
    }

    const TELEGRAM_BOT_TOKEN = process.env.SLAVIK_ADMIN_TELEGRAM_BOT_TOKEN;
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    if (message === '/start') {
      const text = 'started'
      await fetch(`${TELEGRAM_API_URL}?chat_id=${chatId}&text=${text}&parse_mode=HTML`)
    } else if (callbackQuery?.chatId) {
      const ANSWER_TELEGRAM_URL = `https://api.telegram.org/bot${process.env.SLAVIK_TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${callbackQuery?.chatId}&text=${body.callback_query.message.text}&parse_mode=HTML`;
      console.log('ANSWER_TELEGRAM_URL = ', ANSWER_TELEGRAM_URL);
      await fetch(ANSWER_TELEGRAM_URL);

      const query = `
        INSERT INTO messages (userId, userRole, chatId, message)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const result = await pool.query(query, [null, 'assistant', chatId, body.callback_query.message.text]);
      console.log('db result = ', result);
    }
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ status: 'error', message: (error as Error).message }, { status: 500 });
  }
}
