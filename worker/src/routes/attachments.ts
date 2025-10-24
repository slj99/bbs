import { Hono } from 'hono';
import { authMiddleware } from '../auth/middleware';
import type { Bindings, User } from '../types';

const app = new Hono<{ Bindings: Bindings, Variables: { user: User } }>();

// 附件上传需要用户认证
app.use('*', authMiddleware);

// 处理附件上传
app.post('/', async (c) => {
    const user = c.get('user');
    const formData = await c.req.formData();
    const attachmentFile = formData.get('attachment');

    if (!attachmentFile || !(attachmentFile instanceof File)) {
        return c.json({ error: '没有上传附件或格式不正确' }, 400);
    }
    
    // 生成一个唯一的 R2 对象 Key
    const attachmentKey = `attachments/${user.id}/${crypto.randomUUID()}_${attachmentFile.name}`;

    try {
        // 上传文件到 R2
        // 直接将 ArrayBuffer 上传到 R2，避免 Blob 类型不兼容
        const arrayBuffer = await attachmentFile.arrayBuffer();
        await c.env.R2_BUCKET.put(attachmentKey, arrayBuffer, {
            httpMetadata: { 
                contentType: attachmentFile.type,
                // 设置此标头，以便浏览器下载而不是尝试显示文件
                contentDisposition: `attachment; filename="${attachmentFile.name}"`,
            },
        });

        // 返回可公开访问的 URL
        const fileUrl = `${c.env.R2_PUBLIC_URL}/${attachmentKey}`;
        
        return c.json({ 
            url: fileUrl,
            fileName: attachmentFile.name,
            fileSize: attachmentFile.size
        });

    } catch (error) {
        console.error("Attachment upload failed:", error);
        return c.json({ error: '附件上传失败' }, 500);
    }
});

export default app;
