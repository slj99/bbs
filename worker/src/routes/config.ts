import { Hono } from 'hono';
import type { Bindings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

// 此端点用于向前台暴露安全的公共配置
app.get('/', (c) => {
    // 从 wrangler.jsonc 的 [vars] 中读取 RP_NAME
    return c.json({
        rpName: c.env.RP_NAME,
        rpSubtitle: c.env.RP_SUBTITLE,
    });
});

export default app;
