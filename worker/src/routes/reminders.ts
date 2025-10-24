import { Hono } from 'hono';
import { authMiddleware } from '../auth/middleware';
import type { Bindings, User } from '../types';

const app = new Hono<{ Bindings: Bindings, Variables: { user: User } }>();

app.use('*', authMiddleware);

// 获取当前用户的帖子提醒
app.get('/', async (c) => {
    const user = c.get('user');
    const query = `
        SELECT 
            r.id,
            r.created_at,
            actor.id as actor_id,
            actor.username as actor_username,
            actor.avatar as actor_avatar,
            t.title as thread_title,
            r.thread_id
        FROM Reminders r
        JOIN Users actor ON r.actor_id = actor.id
        JOIN Threads t ON r.thread_id = t.id
        WHERE r.recipient_id = ? AND r.type = 'reply_to_thread'
        ORDER BY r.created_at DESC
    `;
    const { results } = await c.env.DB.prepare(query).bind(user.id).all();
    return c.json(results);
});

export default app;
