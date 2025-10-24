import { Hono } from 'hono';
import { authMiddleware } from '../auth/middleware';
import type { Bindings, User } from '../types';

const app = new Hono<{ Bindings: Bindings, Variables: { user: User } }>();

// 图片上传需要用户认证
app.use('*', authMiddleware);

// 处理图片上传
app.post('/', async (c) => {
    const user = c.get('user');
    const formData = await c.req.formData();
    const imageFile = formData.get('image');

    // 验证文件是否存在且为文件类型
    if (!imageFile || !(imageFile instanceof File)) {
        return c.json({ error: '没有上传图片文件或格式不正确' }, 400);
    }
    
    // 验证文件类型
    if (!imageFile.type.startsWith('image/')) {
        return c.json({ error: '只允许上传图片文件' }, 400);
    }

    // 生成一个唯一的 R2 对象 Key
    const imageKey = `thread-images/${user.id}/${crypto.randomUUID()}.${imageFile.name.split('.').pop()}`;

    try {
        // 上传文件到 R2
        await c.env.R2_BUCKET.put(imageKey, <any> imageFile, {
            httpMetadata: { contentType: imageFile.type },
        });
        
        const url = `${c.env.R2_PUBLIC_URL}/${imageKey}`;


        // 返回可公开访问的 URL
        return c.json({ url });

    } catch (error) {
        console.error("Image upload failed:", error);
        return c.json({ error: '图片上传失败' }, 500);
    }
});

export default app;
