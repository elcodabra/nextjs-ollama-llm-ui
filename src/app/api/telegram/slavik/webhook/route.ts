import {NextRequest, NextResponse} from 'next/server';
import {notify} from '@/lib/notify';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('Incoming Telegram update:', JSON.stringify(body, null, 2));

    const message = body.message?.text;
    const chatId = body.message?.chat?.id;
    const firstName = body.message?.from.first_name || '';
    const lastName = body.message?.from.last_name || '';
    const userName = body.message?.from.username || body.message?.from.id;
    const languageCode = body.message?.from.language_code;
    const isPremium = body.message?.from.is_premium;
    // TODO: is_bot

    if (!message || !chatId) {
      return NextResponse.json({status: 'ignored'});
    }

    const ret = await notify({
      message: `Message from @${userName} (${isPremium ? '⭐' : ''}${[firstName, lastName].join(' ')}): ${message}`,
    });

    const TELEGRAM_BOT_TOKEN = process.env.SLAVIK_TELEGRAM_BOT_TOKEN;
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    console.log('message = ', message)

    if (message === '/start') {
      let text = '¡Bienvenido, <b>' + firstName + '</b>! Soy <b>Slavik</b>. Este es mi canal oficial.'
      /*
      if (languageCode === 'en') {
        text = 'Hi, <b>' + firstName + '</b>. I\'m <b>Slavik</b>.%0APlease, ask your questions%0A'
      } else if (languageCode === 'ru') {
        text = 'Привет, <b>' + firstName + '</b>. Меня зовут <b>Славик</b>.%0AНе стесняйся задавай свои вопросы%0A'
      }
      */
      await fetch(TELEGRAM_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            disable_web_page_preview: true,
            parse_mode: 'HTML',
            reply_markup: {
              keyboard: [
                ['/about_me', '/question', '/my_business'],
              ],
              resize_keyboard: true,
              one_time_keyboard: false
            }
          }),
        }
      )
    } else if (message === '/about_me') {
      const text = '' +
        '<b>Soy Slavik Tsaryov, emprendedor residente en Valencia.</b>\n' +
        '\n' +
        'Durante años desarrollé uno de los primeros negocios de shisha en Europa. Abrí 11 tiendas en toda España, lounges exclusivos y construí en Ucrania la mayor fábrica de cazoletas para cachimbas de Europa. Creé sabores propios de tabaco y levanté una marca desde cero.\n' +
        '\n' +
        'Pero lo perdí todo por la guerra. A los 30 años, tuve que empezar desde cero.\n' +
        '\n' +
        'Hoy tengo dos lounges, dos restaurantes y una distribuidora de tabaco en España.\n' +
        '\n' +
        'Comparto mi experiencia para inspirar a otros a avanzar y no rendirse.\n' +
        '\n' +
        'Me gusta hablar claro, sin filtros.\n';
      await fetch(TELEGRAM_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            disable_web_page_preview: true,
            parse_mode: 'Markdown',
          }),
        }
      )
    } else if (message === '/question') {
      const text = '' +
        '¿Tienes una duda importante, una situación complicada o simplemente quieres mi opinión?\n' +
        '\n' +
        'Puedes escribirme directamente aquí. Leo todo personalmente.\n' +
        '\n' +
        'Este canal es para hablar de verdad, sin filtros.\n' +
        '\n' +
        'Pregunta lo que quieras — estoy aquí.';
      await fetch(TELEGRAM_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            disable_web_page_preview: true,
            parse_mode: 'Markdown',
          }),
        }
      )
    } else if (message === '/my_business') {
      const text = '' +
        'Estos son algunos de mis proyectos actuales en España:\n' +
        '\n' +
        '• [Legend Selection](https://www.instagram.com/legendselection_valencia?igsh=MXJqZjVvZTQzdWV6cQ%3D%3D) — restaurante & lounge con cocina fusión, shisha y música.\n' +
        '\n' +
        '• [Legend Lounge](https://www.instagram.com/legendclub_valencia?igsh=MWdvb2ZiMTU5cmh4bA%3D%3D) — lounge de shisha premium.\n' +
        '\n' +
        '• [Batumi](https://www.instagram.com/batumienvalencia?igsh=ejdsZWxxaHAzeTA5) — restaurante de cocina georgiana.\n' +
        '\n' +
        '• [Slib Group](https://www.instagram.com/slib_group?igsh=cnlvYzE1eXpqcnB3) — distribuidora de tabaco en España.\n' +
        '\n' +
        'Siempre estoy desarrollando nuevas ideas.';
      await fetch(TELEGRAM_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            disable_web_page_preview: true,
            parse_mode: 'Markdown',
          }),
        }
      )
    } else {
      // TODO: role = 'user'
      const querySelect = `
          SELECT *
          FROM public.messages
          WHERE chatid = $1
            AND userrole = 'user'
          ORDER BY createdat ASC;
      `;

      const resultSelect = await pool.query(querySelect, [chatId]);
      console.log('resultSelect.rows = ', JSON.stringify(resultSelect.rows, null, 2));

      const response = await fetch(`${process.env.NEXT_PUBLIC_HOST || 'http://localhost:3000'}/api/chat/slavik`, {
        method: 'POST',
        body: JSON.stringify({
          // TODO: history
          messages: [...resultSelect.rows.map(({message}: any) => ({
            role: 'user', content: message, /* {
              type: "text",
              text: message,
            } */
          })) || [], {
            role: 'user',
            content: message,
          }],
        }),
      }).then(res => res.json());
      await notify({
        message: response?.text || 'error',
        replyTo: ret?.data?.result?.message_id,
        replyMarkup: {
          inline_keyboard: [
            [
              {
                "text": "👍",
                // Limit = 64 bytes
                "callback_data": JSON.stringify({chatId, userName}),
              },
              /*
              {
                "text": "Retry",
                "callback_data": "",
              },
              {
                "text": "Ask to pay",
                "callback_data": "",
              }
              */
            ]
          ]
        }
      })
      const query = `
          INSERT INTO messages (userId, userRole, chatId, message)
          VALUES ($1, $2, $3, $4) RETURNING *;
      `;
      const result = await pool.query(query, [userName ?? null, 'user', chatId, message]);
      console.log('db result = ', result);
      // await fetch(`${TELEGRAM_API_URL}?chat_id=${chatId}&text=${response?.text || 'error'}&parse_mode=HTML`)
    }

    return NextResponse.json({status: 'ok'});
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({status: 'error', message: (error as Error).message}, {status: 500});
  }
}
