import type { NextApiRequest, NextApiResponse } from 'next'

// تابع کمکی برای آپدیت فایل در گیت‌هاب
async function updateGitHubFile(section: string, newContent: string) {
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const token = process.env.GITHUB_TOKEN
  
  // اضافه شدن پسوند .mdx به نام بخش (مثلا radar.mdx)
  const path = `pages/${section}.mdx` 
  
  // آدرس صحیح API گیت‌هاب با کلمه /contents/
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`

  let existingContent = ''
  let fileSha: string | undefined = undefined

  // ۱. تلاش برای دریافت فایل فعلی
  const getRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  if (getRes.ok) {
    // فایل وجود دارد، اطلاعاتش را می‌گیریم
    const fileData = await getRes.json()
    existingContent = Buffer.from(fileData.content, 'base64').toString('utf-8')
    fileSha = fileData.sha // برای آپدیت فایل به این کد نیاز داریم
  } else if (getRes.status === 404) {
    // فایل وجود ندارد، پس یک هدر پیش‌فرض برایش می‌سازیم تا از صفر ساخته شود
    console.log(`فایل ${path} پیدا نشد. یک فایل جدید ساخته می‌شود...`)
    existingContent = `# ${section.toUpperCase()} 📡\n\nاینجا خروجی‌های ایجنت قرار می‌گیرد.\n\n---`
  } else {
    throw new Error(`خطای گیت‌هاب: ${getRes.status} ${getRes.statusText}`)
  }
  
  // ترکیب محتوای قبلی با دیتای جدید
  const updatedContent = `${existingContent}\n\n${newContent}`
  const encodedContent = Buffer.from(updatedContent).toString('base64')

  // بدنه درخواست برای کامیت
  const bodyData: any = {
    message: `🤖 Update ${section} via Peste Agent`,
    content: encodedContent,
  }
  
  // اگر فایل از قبل وجود داشت، sha را ارسال می‌کنیم تا اوررایت (Overwrite) شود
  if (fileSha) {
    bodyData.sha = fileSha
  }

  // ۲. ارسال درخواست PUT برای کامیت (آپدیت یا ساخت)
  const putRes = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyData)
  })

  if (!putRes.ok) {
    const errorData = await putRes.json()
    throw new Error(`خطا در ذخیره فایل: ${JSON.stringify(errorData)}`)
  }
  
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