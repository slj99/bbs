import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../auth/middleware';
import type { Bindings, User } from '../types';

const app = new Hono<{ Bindings: Bindings, Variables: { user: User } }>();

// 所有私信相关操作都需要用户认证
app.use('*', authMiddleware);

// 获取当前用户的会话列表
app.get('/', async (c) => {
    const user = c.get('user');
    const query = `
        SELECT 
            c.id, c.last_message_at, c.last_message_excerpt,
            -- 确定对话伙伴的用户名和头像
            CASE WHEN c.user1_id = ?1 THEN u2.username ELSE u1.username END as partner_username,
            CASE WHEN c.user1_id = ?1 THEN u2.avatar ELSE u1.avatar END as partner_avatar,
            -- 获取当前用户的未读消息数
            CASE WHEN c.user1_id = ?1 THEN c.user1_unread_count ELSE c.user2_unread_count END as unread_count
        FROM Conversations c
        JOIN Users u1 ON c.user1_id = u1.id
        JOIN Users u2 ON c.user2_id = u2.id
        WHERE c.user1_id = ?1 OR c.user2_id = ?1
        ORDER BY c.last_message_at DESC
    `;
    const { results } = await c.env.DB.prepare(query).bind(user.id).all();
    return c.json(results);
});

// 获取指定会话的所有消息
app.get('/:conversationId', async (c) => {
    const user = c.get('user');
    const conversationId = c.req.param('conversationId');
    
    // 安全性检查：确保当前用户是此会话的参与者
    const convCheck = await c.env.DB.prepare("SELECT user1_id, user2_id FROM Conversations WHERE id = ?").bind(conversationId).first<{user1_id: string, user2_id: string}>();
    if (!convCheck || (convCheck.user1_id !== user.id && convCheck.user2_id !== user.id)) {
        return c.json({ error: "Forbidden" }, 403);
    }

    // 获取消息
    const messagesQuery = `
        SELECT pm.id, pm.body, pm.created_at, u.username as author_username
        FROM PrivateMessages pm
        JOIN Users u ON pm.author_id = u.id
        WHERE pm.conversation_id = ?
        ORDER BY pm.created_at ASC
    `;
    const { results: messages } = await c.env.DB.prepare(messagesQuery).bind(conversationId).all();

    // 从 R2 并行获取所有消息的正文
    const messagesWithBody = await Promise.all(messages.map(async (msg: any) => {
        const obj = await c.env.R2_BUCKET.get(msg.body);
        return { ...msg, body: obj ? await obj.text() : '' };
    }));
    
    // 将该会话中当前用户的未读消息数清零
    const unreadFieldToClear = convCheck.user1_id === user.id ? 'user1_unread_count' : 'user2_unread_count';
    await c.env.DB.prepare(`UPDATE Conversations SET ${unreadFieldToClear} = 0 WHERE id = ?`).bind(conversationId).run();

    return c.json(messagesWithBody);
});

// 发送新消息
const sendMessageSchema = z.object({
    recipientUsername: z.string(),
    body: z.string().min(1)
});
app.post('/', zValidator('json', sendMessageSchema), async (c) => {
    const user = c.get('user');
    const { recipientUsername, body } = c.req.valid('json');
    const db = c.env.DB;

    const recipient = await db.prepare("SELECT id FROM Users WHERE username = ?").bind(recipientUsername).first<{id: string}>();
    if (!recipient) return c.json({ error: '用户不存在' }, 404);
    if (recipient.id === user.id) return c.json({ error: "不能给自己发送消息" }, 400);

    const [user1_id, user2_id] = [user.id, recipient.id].sort();

    // 查找或创建会话
    let conversation = await db.prepare("SELECT id FROM Conversations WHERE user1_id = ? AND user2_id = ?").bind(user1_id, user2_id).first<{id: number}>();
    
    const now = Math.floor(Date.now() / 1000);
    let conversationId: number;

    if (conversation) {
        conversationId = conversation.id;
    } else {
        const { meta } = await db.prepare("INSERT INTO Conversations (user1_id, user2_id, created_at, last_message_at) VALUES (?, ?, ?, ?)")
            .bind(user1_id, user2_id, now, now).run();
        conversationId = meta.last_row_id!;
    }

    const bodyR2Key = `pm-body/${crypto.randomUUID()}`;
    await c.env.R2_BUCKET.put(bodyR2Key, body);
    
    await db.prepare("INSERT INTO PrivateMessages (conversation_id, author_id, body, created_at) VALUES (?, ?, ?, ?)")
        .bind(conversationId, user.id, bodyR2Key, now).run();
    
    const excerpt = body.replace(/<[^>]*>?/gm, '').substring(0, 50); // 移除HTML标签后截取
    const unreadFieldToIncrement = user1_id === user.id ? 'user2_unread_count' : 'user1_unread_count';
    
    await db.prepare(`
        UPDATE Conversations 
        SET last_message_at = ?, last_message_excerpt = ?, ${unreadFieldToIncrement} = ${unreadFieldToIncrement} + 1
        WHERE id = ?
    `).bind(now, excerpt, conversationId).run();

    return c.json({ message: "消息已发送", conversationId }, 201);
});

export default app;
