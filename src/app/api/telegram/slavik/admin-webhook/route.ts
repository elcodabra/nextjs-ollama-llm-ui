import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import getAnswer from "@/lib/get-answer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('Incoming Telegram update for Admin:', JSON.stringify(body, null, 2));

    const message = body.message?.text;
    const replyToMsg = body.message?.reply_to_message;
    const chatId = body.message?.chat?.id;
    const callbackQuery = body.callback_query ? JSON.parse(body.callback_query.data) : null;

    if ((!message || !chatId) && !callbackQuery) {
      return NextResponse.json({ status: 'ignored' });
    }

    const TELEGRAM_BOT_TOKEN = process.env.SLAVIK_ADMIN_TELEGRAM_BOT_TOKEN;
    const ADMIN_CHAT_ID = process.env.SLAVIK_ADMIN_TELEGRAM_CHAT_ID;
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    if (message === '/start') {
      const text = 'started'
      await fetch(`${TELEGRAM_API_URL}?chat_id=${chatId}&text=${text}&parse_mode=HTML`)
    } else if (message === '/get_users') {
      const query = `
          SELECT DISTINCT(userid)
          FROM public.messages;
      `;
      const result = await pool.query(query);
      const filtered = result.rows.filter((row: any) => !!row.userid);
      const text = '<b>Count: ' + filtered.length + '</b>%0A' + filtered.map((row: any) => `@${row.userid}`).join('%0A');
      await fetch(`${TELEGRAM_API_URL}?chat_id=${chatId}&text=${text}&parse_mode=HTML`)
    } else if (message?.startsWith('/get_user_messages ')) {
      const userId = message.split(' ')[1].replace('@', '');
      const query = `
          SELECT *
          FROM public.messages
          WHERE userid = $1
          ORDER BY createdat ASC
      `;
      const result = await pool.query(query, [userId]);
      const text = '<b>Count: ' + result.rows.length + '</b>%0A' + result.rows.map((row: any) => `${row.userrole}: ${row.message}`).join('%0A');
      await fetch(`${TELEGRAM_API_URL}?chat_id=${chatId}&text=${text}&parse_mode=HTML`)
    } else if (replyToMsg?.reply_markup?.inline_keyboard?.[0]?.[0]?.callback_data && message) {
      console.log('REPLY MANUAL')
      const { chatId , userName } = JSON.parse(replyToMsg?.reply_markup?.inline_keyboard?.[0]?.[0]?.callback_data);
      const ANSWER_TELEGRAM_URL = `https://api.telegram.org/bot${process.env.SLAVIK_TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${chatId}&text=${message}&parse_mode=HTML`;
      console.log('ANSWER_TELEGRAM_URL = ', ANSWER_TELEGRAM_URL);
      await fetch(ANSWER_TELEGRAM_URL);

      // TODO: chatMessageId
      const query = `
        INSERT INTO messages (userId, userRole, chatId, message)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;

      const result = await pool.query(query, [userName || null, 'assistant', chatId, message]);
      console.log('db result = ', result);

      console.log('replyToMsg.messageId = ', replyToMsg.message_id);
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          message_id: replyToMsg.message_id,
          text: `[👍DONE] ${message}`,
          // reply_markup: replyToMsg.reply_markup, TODO: if needs more reply
          disable_web_page_preview: true,
          parse_mode: 'HTML',
        })
      }).then(res => res.json());
      console.log('upd msg result = ', res)

    } else if (callbackQuery?.chatId) {

      const buttonType = body.callback_query.message.reply_markup?.inline_keyboard?.[0]?.[0]?.text;
      const text = body.callback_query.message.text;

      console.log('buttonType = ', buttonType);

      if (buttonType === '🔄') {
        await getAnswer({
          chatId: callbackQuery.chatId,
          userName: callbackQuery.userName,
          message: text,
          replyTo: body.callback_query.message.message_id,
        });
        return NextResponse.json({ status: 'ok' });
      }

      const ANSWER_TELEGRAM_URL = `https://api.telegram.org/bot${process.env.SLAVIK_TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${callbackQuery?.chatId}&text=${text}&parse_mode=HTML`;
      console.log('ANSWER_TELEGRAM_URL = ', ANSWER_TELEGRAM_URL);
      await fetch(ANSWER_TELEGRAM_URL);

      // TODO: chatMessageId
      const query = `
        INSERT INTO messages (userId, userRole, chatId, message)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const result = await pool.query(query, [callbackQuery.userName || null, 'assistant', callbackQuery.chatId, text]);
      console.log('db result = ', result);

      const messageId = body.callback_query.message.message_id;
      console.log('messageId = ', messageId, text);
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          message_id: messageId,
          text: `[👍 DONE] ${text}`,
          reply_markup: {
            inline_keyboard: []
          },
          disable_web_page_preview: true,
          parse_mode: 'HTML',
        })
      }).then(res => res.json());
      console.log('upd msg result = ', res);
    }
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    // return NextResponse.json({ status: 'error', message: (error as Error).message }, { status: 500 });
    return NextResponse.json({ status: 'error', message: (error as Error).message });
  }
}
