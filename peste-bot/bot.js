import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cron from 'node-cron';

dotenv.config({ path: '../.env.local' });

// Initialize the new brain with Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const API_URL = 'http://localhost:3000/api/agent'; 
const API_SECRET = process.env.AGENT_SECRET_KEY;

bot.start((ctx) => ctx.reply('Hello! I am Peste. My brain now runs on Gemini. 🤖⚡'));

async function processAndPublish(url, titleOverride, customDescription) {
  try {
    let title = titleOverride;
    let summary = customDescription;

    if (url && !customDescription) {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      title = title || $('title').text() || 'New Project';
      
      $('script, style, noscript, nav, footer, header, iframe').remove();
      let pageText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);

      // Send request to Gemini
      const prompt = `You are Peste. Write a 2-3 line interesting and professional summary in Persian of this project.\n\nTitle: ${title}\n\nContent: ${pageText}`;
      const result = await aiModel.generateContent(prompt);
      summary = result.response.text();
    }

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

bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const urlMatch = text.match(/(https?:\/\/[^\s]+)/g);
  if (!urlMatch) return ctx.reply('Please send a valid link or wait for the automatic loop.');
  
  await ctx.reply('Processing the link with the new brain... 🧠🕵️‍♀️');
  await processAndPublish(urlMatch[0], null, null);
  ctx.reply('✅ Done and published on the site!');
});

// Set up Cron Job
cron.schedule('30 15 * * *', async () => {
  console.log('⏰ Time for Peste\'s automatic loop has arrived...');
  
  try {
    const prompt = 'Introduce an interesting, trending, and practical open-source project or tool in the programming field that has recently gained popularity. Return the output only and strictly in valid JSON format with keys: title, url, description (in Persian) and do not write any additional text.';
    const result = await aiModel.generateContent(prompt);
    let resultText = result.response.text();
    
    const cleanedJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const projectData = JSON.parse(cleanedJson);

    await processAndPublish(projectData.url, projectData.title, projectData.description);
    console.log('Automatic loop report: New project successfully added to the site.');
  } catch (e) {
    console.error('Error in Cron Job execution:', e.message);
  }
});

bot.launch();
console.log('🤖 Peste Agent with Gemini brain started...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));