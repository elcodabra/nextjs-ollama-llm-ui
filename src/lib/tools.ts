import { z } from 'zod';
import { tool } from 'ai';

export function getWeather(location: string): string {
  return `Погода в ${location} — солнечно, 22°C.`;
}

export const weatherTool = tool({
  description: 'Get the weather in a location',
  parameters: z.object({
    location: z.string().describe('The location to get the weather for'),
  }),
  // execute: async ({ location }) => getWeather(location),
  execute: async ({ location }) => {
    return ({
      location,
      temperature: 72 + Math.floor(Math.random() * 21) - 10,
    })
  },
})

export const getAvailableSlots = tool({
  description: 'Get available slots',
  parameters: z.object({
    day: z.string().describe('The day to get the available slots for'),
  }),
  execute: async ({ day }) => {
    console.log('getAvailableSlots day = ', day);
    const result = await fetch(`https://api.cal.com/v1/slots?apiKey=${process.env.CAL_TOKEN}&eventTypeId=${'2150664'}&startTime=${new Date().toISOString()}&endTime=${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}&timezone=${'Europe/Berlin'}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.CAL_TOKEN}`,
        'Content-Type': 'application/json',
      }
    })
      .then(response => response.json())
      .catch(err => console.error(err));
    console.log('getAvailableSlots result = ', result)
    return result?.slots;
  },
})

export const createBooking = tool({
  description: 'Create a booking',
  parameters: z.object({
    name: z.string().describe('The name to create booking for'),
    email: z.string().describe('The email to create booking for'),
    startTime: z.string().describe('The startTime to create booking for'),
    endTime: z.string().describe('The endTime to create booking for'),
    timeZone: z.string().describe('The timeZone to create booking for'),
  }),
  execute: async ({ name, email, startTime, endTime, timeZone }) => {
    console.log('createBooking params = ', { name, email, startTime, endTime, timeZone });
    const result = await fetch(`https://api.cal.com/v1/bookings?apiKey=${process.env.CAL_TOKEN}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CAL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventTypeId: 2150664,
        start: startTime,
        end: endTime,
        responses: {
          name,
          email,
          // location: {"value":"userPhone","optionValue":""}
        },
        timeZone: 'Europe/Berlin',
        language: 'en',
        metadata: {},
        // eventTypeSlug: 'elcodabra',
      }),
    })
      .then(response => response.json())
      .catch(err => console.error(err));
    console.log('createBooking result = ', result)
    return result;
  },
})

// TODO: https://langchain-ai.github.io/langgraphjs/tutorials/rag/langgraph_agentic_rag/#nodes-and-edges:~:text=graph%20like%20this%3A-,Edges,-%C2%B6
export const giveRelevanceScore = tool({
  description: "Give a relevance score to the retrieved documents.",
  parameters: z.object({
    binaryScore: z.string().describe("Relevance score 'yes' or 'no'"),
  }),
  execute: async ({ binaryScore }) => {
    console.log('binaryScore = ', binaryScore);
  },
});

export const retrieverTool = tool({
  parameters: z.object({
    query: z.string().describe('The query search get the information for'),
  }),
  description: "Search and return information about visas, startups, countries and whole site s-hub.world",
  execute: async ({ query }) => {
    console.log('retrieverTool query = ', query);
    const result = await fetch(`${'http://localhost:3000'}/api/vectors/generate?name=${'SHubWorld'}&query=${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
      .then(response => response.json())
      .catch(err => console.error(err));
    console.log('retrieverTool result = ', result)
    // TODO: return as is
    return result;
  },
});
