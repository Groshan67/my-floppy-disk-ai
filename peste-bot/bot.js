import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import cron from 'node-cron';

dotenv.config({ path: '../.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const API_URL = 'http://localhost:3000/api/agent'; 
const API_SECRET = process.env.AGENT_SECRET_KEY;

bot.start((ctx) => ctx.reply('Hello! I am Peste. I check the links you send and also automatically find interesting projects every day. 🤖⚡'));

// Main function for content generation and publishing to the site
async function processAndPublish(url, titleOverride, customDescription) {
  try {
    let title = titleOverride;
    let summary = customDescription;

    // If a link is provided, fetch its content and summarize it
    if (url && !customDescription) {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      title = title || $('title').text() || 'New Project';
      
      $('script, style, noscript, nav, footer, header, iframe').remove();
      let pageText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);

      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are Peste. Write a 2-3 line interesting and professional summary in Persian of this project.' },
          { role: 'user', content: `Title: ${title}\n\nContent: ${pageText}` }
        ]
      });
      summary = aiResponse.choices[0].message.content;
    }

    // Send to the site API
    await axios.post(API_URL, {
      section: 'radar',
      title: title,
      description: summary,
      url: url || 'https://github.com'
    }, {
      headers: {
        'Authorization': `Bearer ${API_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`[Autonomous Agent] Content successfully published on the site: ${title}`);
  } catch (error) {
    console.error('Error in automatic publishing:', error.message);
  }
}

// 1. Receive manual links via Telegram (as before)
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const urlMatch = text.match(/(https?:\/\/[^\s]+)/g);
  if (!urlMatch) return ctx.reply('Please send a valid link or wait for the automatic loop.');
  
  await ctx.reply('Processing the link... 🕵️‍♀️');
  await processAndPublish(urlMatch[0], null, null);
  ctx.reply('✅ Done and published on the site!');
});

// 2. Define the automatic loop (Cron Job) - Every day at 10:00 AM
// Format: minute hour day month day_of_week (0 10 * * *)
cron.schedule('0 10 * * *', async () => {
  console.log('⏰ Time for Peste\'s automatic loop has arrived...');
  
  try {
    // Ask the AI to suggest an interesting open-source project
    const aiPrompt = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Introduce an interesting, trending, and practical open-source project or tool in the programming field that has recently gained popularity. Return the output only in JSON format with keys: title, url, description (in Persian).' },
        { role: 'user', content: 'Introduce a project.' }
      ]
    });

    const resultText = aiPrompt.choices[0].message.content;
    // Clean up and convert the output to JSON
    const cleanedJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const projectData = JSON.parse(cleanedJson);

    // Automatically publish to the site
    await processAndPublish(projectData.url, projectData.title, projectData.description);
    
    // Send a report message to you on Telegram (optional - if you have your chat ID)
    console.log('Automatic loop report: New project successfully added to the site.');
  } catch (e) {
    console.error('Error in Cron Job execution:', e.message);
  }
});

bot.launch();
console.log('🤖 Peste Agent with automatic loop (Cron) capability started...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));