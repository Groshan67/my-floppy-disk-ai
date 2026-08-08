import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Path to the site config file which is one folder back
dotenv.config({ path: '../.env.local' });

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const API_URL = 'http://localhost:3000/api/agent'; 
const API_SECRET = process.env.AGENT_SECRET_KEY;

bot.start((ctx) => ctx.reply('Hello! I am Peste. At your service. 🤖'));

bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const urlMatch = text.match(/(https?:\/\/[^\s]+)/g);
  if (!urlMatch) return ctx.reply('Please send a valid link.');
  
  const url = urlMatch[0];
  await ctx.reply('Checking the link... 🕵️‍♀️');

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const title = $('title').text() || 'Unknown title';
    const description = $('meta[name="description"]').attr('content') || 'No description found.';

    const response = await axios.post(API_URL, {
      section: 'radar',
      title: title,
      description: description,
      url: url
    }, {
      headers: {
        'Authorization': `Bearer ${API_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    ctx.reply(`✅ Done! ${response.data.message}`);
  } catch (error) {
    console.error(error.message);
    ctx.reply('❌ An error occurred while communicating with the site.');
  }
});

bot.launch();
console.log('🤖 Peste bot (ESM) started successfully...');

// Graceful shutdown of the bot
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));