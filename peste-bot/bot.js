import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';
import cron from 'node-cron';

dotenv.config({ path: '../.env.local' });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const API_URL = 'http://localhost:3000/api/agent'; 
const API_SECRET = process.env.AGENT_SECRET_KEY;

bot.start((ctx) => ctx.reply('Agent is online and ready.'));

// تابع انتشار که مطمئن می‌شود image همیشه وجود دارد
async function processAndPublish(projectData) {
  try {
    
    console.log('projectData',projectData)
    // تعیین تصویر پیش‌فرض در صورت خالی بودن مقادیر
    const defaultImage = `https://opengraph.githubassets.com/1/${projectData.title.replace(/\s+/g, '-')}`;
    
    const finalPayload = {
      ...projectData,
      image: (projectData.image && projectData.image.trim() !== '') 
        ? projectData.image 
        : defaultImage
    };

    await axios.post(API_URL, {
      section: 'radar',
      ...finalPayload
    }, {
      headers: {
        'Authorization': `Bearer ${API_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`[Agent] Published successfully: ${finalPayload.title} with image: ${finalPayload.image}`);
  } catch (error) {
    console.error('[Agent] Publish Error:', error.message);
  }
}

// استخراج دستی لینک
async function handleManualUrl(targetUrl) {
  try {
    const { data } = await axios.get(targetUrl);
    const $ = cheerio.load(data);
    
    const pageTitle = $('title').text() || 'New Project';
    
    // دریافت تصویر og:image یا twitter:image
    let ogImage = $('meta[property="og:image"]').attr('content') || 
                  $('meta[name="twitter:image"]').attr('content') || '';

    $('script, style, noscript, nav, footer, header, iframe').remove();
    let pageText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);

    const prompt = `Analyze this webpage content and return ONLY a valid JSON object with strictly these keys:
{
  "title": "Project Name",
  "description": "Concise 2-3 line summary in Persian",
  "tags": ["TAG1", "TAG2"],
  "whyItMatters": "1 sentence in Persian on key value",
  "stars": 0
}

Content:
Title: ${pageTitle}
Text: ${pageText}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt
    });

    let resultText = response.text;
    const cleanedJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(cleanedJson);

    const fullProjectData = {
      title: aiData.title || pageTitle,
      url: targetUrl,
      description: aiData.description,
      image: ogImage, // تصویر استخراج شده
      tags: aiData.tags || [],
      whyItMatters: aiData.whyItMatters || '',
      stars: aiData.stars || 0
    };

    await processAndPublish(fullProjectData);
  } catch (error) {
    console.error('[Agent] Manual Processing Error:', error.message);
  }
}

// ۱. پردازش پیام‌های تلگرام
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const urlMatch = text.match(/(https?:\/\/[^\s]+)/g);
  if (!urlMatch) return ctx.reply('Please send a valid URL.');
  
  await ctx.reply('Processing link and extracting image...');
  await handleManualUrl(urlMatch[0]);
  ctx.reply('Done! Check the website.');
});

// ۲. کرون جاب خودکار
cron.schedule('34 14 * * *', async () => {
  console.log('[Agent] Cron Job Triggered...');
  
  try {
    const prompt = `Introduce a trending open-source programming tool.
Return ONLY a raw JSON object with no markdown fences, formatted exactly like this:
{
  "title": "Project Title",
  "url": "https://github.com/...",
  "description": "2-3 line English summary",
  "image": "https://raw.githubusercontent.com/... or og-image link if known, else leave empty string",
  "tags": ["TAG1", "TAG2"],
  "whyItMatters": "English value sentence",
  "stars": 1000
}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt
    });

    let resultText = response.text;
    const cleanedJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const projectData = JSON.parse(cleanedJson);

    // پاس دادن به تابع اصلی که از حذف image جلوگیری می‌کند
    await processAndPublish(projectData);
    console.log('[Agent] Cron Job Success.');
  } catch (e) {
    console.error('[Agent] Cron Job Error:', e.message);
  }
});

bot.launch();
console.log('[Agent] Bot running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));