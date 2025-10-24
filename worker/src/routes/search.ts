import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Bindings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

const searchSchema = z.object({
    q: z.string().min(1, "搜索词不能为空"),
    type: z.enum(['threads', 'users']).default('threads'),
    page: z.string().transform(Number).default('1'),
});

// 搜索端点
app.get('/', zValidator('query', searchSchema), async (c) => {
    const { q, type, page } = c.req.valid('query');
    const db = c.env.DB;

    // 使用 LIKE 操作符进行模糊搜索
    const searchTerm = `%${q}%`;
    const limit = 20;
    const offset = (page - 1) * limit;

    try {
        if (type === 'threads') {
            const query = `
                SELECT 
                    t.id, t.title, t.body, t.node_id, t.created_at,
                    u.username as author_username,
                    u.id as author_id,
                    n.name as node_name
                FROM Threads t
                JOIN Users u ON t.author_id = u.id
                JOIN Nodes n ON t.node_id = n.id
                WHERE t.title LIKE ?1 OR t.body LIKE ?1
                ORDER BY t.created_at DESC
                LIMIT ?2 OFFSET ?3
            `;
            const { results } = await db.prepare(query).bind(searchTerm, limit, offset).all();
            return c.json(results);
        } else if (type === 'users') {
            const query = `
                SELECT 
                    id, username, avatar, level,
                    (SELECT COUNT(*) FROM Threads WHERE author_id = Users.id) as thread_count
                FROM Users
                WHERE username LIKE ?1
                LIMIT 50
            `;
            const { results } = await db.prepare(query).bind(searchTerm).all();
            return c.json(results);
        }
    } catch (e) {
        console.error(e);
        return c.json({ error: '搜索时发生错误' }, 500);
    }

    return c.json({ error: '无效的搜索类型' }, 400);
});

export default app;
