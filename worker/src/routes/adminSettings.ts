import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Bindings } from '../types';
import { adminAuthMiddleware } from './admin';

const app = new Hono<{ Bindings: Bindings }>();
app.use('/*', adminAuthMiddleware);

// 获取所有站点设置
app.get('/', async (c) => {
    const { results } = await c.env.DB.prepare("SELECT key, value FROM Settings").all();
    const settings = (results || []).reduce((acc, { key, value }) => {
        // 尝试解析 JSON 字符串
        try { acc[key] = JSON.parse(value); }
        catch (e) { acc[key] = value; }
        return acc;
    }, {} as Record<string, any>);
    return c.json(settings);
});

// 更新站点设置
const settingsSchema = z.record(z.any()); // 允许任意 key-value
app.put('/', zValidator('json', settingsSchema), async (c) => {
    const settingsToUpdate = c.req.valid('json');
    const db = c.env.DB;

    const stmts = Object.entries(settingsToUpdate).map(([key, value]) => 
        db.prepare("INSERT OR REPLACE INTO Settings (key, value) VALUES (?, ?)")
          .bind(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
    );

    await db.batch(stmts);
    return c.json({ message: "站点设置已更新" });
});

// 处理 LOGO 上传
app.post('/logo', async (c) => {
    const formData = await c.req.formData();
    const logoFile = formData.get('logo');
    
    const allowedTypes = ['image/svg+xml', 'image/jpeg', 'image/png', 'image/gif'];
    if (!logoFile || !(logoFile instanceof File) || !allowedTypes.includes(logoFile.type)) {
        return c.json({ error: '请上传有效的图片文件 (SVG, JPG, PNG, GIF)' }, 400);
    }

    const logoKey = `site/logo.${logoFile.name.split('.').pop()}`;

    try {
        await c.env.R2_BUCKET.put(logoKey, <any> logoFile, { httpMetadata: { contentType: logoFile.type } });
        
        // 使用配置好的公开 URL 来构建并存储完整的图片地址
        const logoUrl = `${c.env.R2_PUBLIC_URL}/${logoKey}`;
        await c.env.DB.prepare("INSERT OR REPLACE INTO Settings (key, value) VALUES ('site_logo_url', ?)")
            .bind(logoUrl)
            .run();
            
        return c.json({ message: 'LOGO 上传成功', url: logoUrl });
    } catch (error) {
        console.error("Logo upload failed:", error);
        return c.json({ error: 'LOGO 上传失败' }, 500);
    }
});

export default app;

