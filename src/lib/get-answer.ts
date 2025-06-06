import pool from '@/lib/db';
import { notify } from '@/lib/notify';

// TODO: role = 'user'
const querySelect = `
  SELECT *
  FROM public.messages
  WHERE chatid = $1
    AND userrole = 'user'
  ORDER BY createdat ASC;
`;

const queryInsert = `
  INSERT INTO messages (userId, userRole, chatId, message)
  VALUES ($1, $2, $3, $4) RETURNING *;
`;

interface GetAnswerParams {
  chatId: number;
  userName: string;
  message: string;
  replyTo?: number;
}

const getAnswer = async ({
  chatId,
  userName,
  message,
  replyTo,
}: GetAnswerParams) => {
  console.log('getAnswer')

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
    replyTo: replyTo,
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
  const result = await pool.query(queryInsert, [userName ?? null, 'user', chatId, message]);
  console.log('db result = ', result);
  // await fetch(`${TELEGRAM_API_URL}?chat_id=${chatId}&text=${response?.text || 'error'}&parse_mode=HTML`)
}

export default getAnswer;
