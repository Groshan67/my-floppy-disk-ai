import type { NextApiRequest, NextApiResponse } from 'next'

// تابع کمکی برای آپدیت فایل در گیت‌هاب
async function updateGitHubFile(section: string, newContent: string) {
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const token = process.env.GITHUB_TOKEN
  const path = `pages/${section}.mdx` // مثلاً pages/radar.mdx

  const url = `https://api.github.com/repos/${owner}/${repo}/${path}`

  // ۱. دریافت فایل فعلی از گیت‌هاب (برای گرفتن SHA و محتوای قبلی)
  const getRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  console.log('getRes',getRes)
  if (!getRes.ok) throw new Error('فایل در گیت‌هاب پیدا نشد.')
  const fileData = await getRes.json()
  
  // دی‌کد کردن محتوای فعلی از Base64 به متن
  const existingContent = Buffer.from(fileData.content, 'base64').toString('utf-8')
  
  // ترکیب محتوای قبلی با محتوای جدیدی که ایجنت فرستاده
  const updatedContent = `${existingContent}\n\n${newContent}`
  
  // انکد کردن مجدد به Base64 برای ارسال به گیت‌هاب
  const encodedContent = Buffer.from(updatedContent).toString('base64')

  // ۲. ارسال محتوای جدید (کامیت کردن)
  const putRes = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `🤖 Update ${section} via Peste Agent`, // پیام کامیت
      content: encodedContent,
      sha: fileData.sha, // ارسال SHA برای تایید آپدیت فایل قبلی الزامی است
    })
  })

  if (!putRes.ok) throw new Error('خطا در ذخیره فایل در گیت‌هاب.')
  return await putRes.json()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' })

  if (req.headers.authorization !== `Bearer ${process.env.AGENT_SECRET_KEY}`) {
    return res.status(401).json({ message: 'Unauthorized!' })
  }

  const { section, title, description, url } = req.body

  try {
    // ساختاربندی محتوایی که قرار است اضافه شود
    const newMdxContent = `### ${title}\n${description}\n\n[لینک ضمیمه](${url})\n\n---`

    // فراخوانی تابع گیت‌هاب
    await updateGitHubFile(section, newMdxContent)

    return res.status(200).json({ message: 'محتوا با موفقیت کامیت شد!' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'خطا در کامیت گیت‌هاب' })
  }
}