import type { NextApiRequest, NextApiResponse } from 'next'

// تابع کمکی برای آپدیت یا ساخت فایل در گیت‌هاب
async function updateGitHubFile(section: string, projectData: any) {
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const token = process.env.GITHUB_TOKEN
  
  const path = `pages/${section}.mdx` 
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`

  let existingContent = ''
  let fileSha: string | undefined = undefined

  // ۱. دریافت فایل فعلی از گیت‌هاب
  const getRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  if (getRes.ok) {
    const fileData = await getRes.json()
    existingContent = Buffer.from(fileData.content, 'base64').toString('utf-8')
    fileSha = fileData.sha
  } else if (getRes.status === 404) {
    console.log(`فایل ${path} پیدا نشد. ساخت فایل اولیه...`)
    // ساختار اولیه فایل MDX در صورت عدم وجود
    existingContent = `import { ProjectView } from '../components/ProjectView'\n\n# ${section.toUpperCase()} 📡\n\nاینجا خروجی‌های ایجنت قرار می‌گیرد.\n\n---\n\n<div className="mt-10 flex flex-col gap-8">\n</div>`
  } else {
    throw new Error(`خطای گیت‌هاب: ${getRes.status} ${getRes.statusText}`)
  }

  // ۲. ساخت کد JSX کامپوننت ProjectView با تمام مقادیر
  const componentJsx = `  <ProjectView 
    projectData={${JSON.stringify(projectData, null, 6)}} 
  />`

  // ۳. تزریق کامپوننت جدید درون کانتینر
  let updatedContent = ''
  
  if (existingContent.includes('<div className="mt-10 flex flex-col gap-8">')) {
    // تزریق پروژه جدید در بالاتربن قسمت کانتینر (جدیدترین‌ها اول بیایند)
    updatedContent = existingContent.replace(
      '<div className="mt-10 flex flex-col gap-8">',
      `<div className="mt-10 flex flex-col gap-8">\n${componentJsx}`
    )
  } else {
    // اگر کانتینر وجود نداشت، به انتهای فایل اضافه شود
    updatedContent = `${existingContent}\n\n${componentJsx}`
  }

  const encodedContent = Buffer.from(updatedContent).toString('base64')

  const bodyData: any = {
    message: `🤖 Add ${projectData.title || 'project'} to ${section} via Agent`,
    content: encodedContent,
  }
  
  if (fileSha) {
    bodyData.sha = fileSha
  }

  // ۴. ارسال کامیت به گیت‌هاب
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

  // دریافت تمام مقادیر ارسال شده از bot.js
  const { section = 'radar', ...projectData } = req.body

  try {
    // فراخوانی تابع کامیت گیت‌هاب
    await updateGitHubFile(section, projectData)

    return res.status(200).json({ message: 'پروژه با موفقیت به گیت‌هاب اضافه شد!' })
  } catch (error: any) {
    console.error('[API Agent Error]:', error)
    return res.status(500).json({ message: 'خطا در کامیت گیت‌هاب', error: error.message })
  }
}