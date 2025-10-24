import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../auth/middleware';
import type { Bindings, Thread, ThreadWithAuthor, ReplyWithAuthor, CommentWithAuthor, User, PollOption, UserVote, ThreadWithDetails, Reply } from '../types';

const app = new Hono<{ Bindings: Bindings, Variables: { user: User } }>();

// 获取某个节点下的帖子列表 (分页)
const listThreadsSchema = z.object({
    nodeId: z.string().transform(Number),
    page: z.string().transform(Number).default('1'),
});

app.get('/', zValidator('query', listThreadsSchema), async (c) => {
    const { nodeId, page } = c.req.valid('query');
    const limit = 20;
    const offset = (page - 1) * limit;

    try {
        const query = c.env.DB.prepare(`
            SELECT t.*, u.username as author_username, u.avatar as author_avatar, last_reply_user.username as last_reply_username, t.reply_count, t.view_count, t.last_reply_at, t.last_reply_id, t.is_pinned
            FROM Threads t
            JOIN Users u ON t.author_id = u.id
            LEFT JOIN Users last_reply_user ON t.last_reply_user_id = last_reply_user.id
            WHERE t.node_id = ?
            ORDER BY t.is_pinned DESC, t.last_reply_at DESC, t.created_at DESC
            LIMIT ? OFFSET ?
        `).bind(nodeId, limit, offset);

        const { results } = await query.all<ThreadWithAuthor>();
        return c.json(results || []);
    } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to fetch threads' }, 500);
    }
});


// 创建一个新帖子
const createThreadSchema = z.object({
    nodeId: z.number(),
    title: z.string().min(2),
    body: z.string().min(10),
    type: z.enum(['discussion', 'poll']),
    readPermission: z.number().int().min(0),
    pollOptions: z.array(z.string().min(1)).optional(),
    isAuthorOnly: z.boolean().optional(),
});

app.post('/', authMiddleware, zValidator('json', createThreadSchema), async (c) => {
    const { nodeId, title, body, type, readPermission, isAuthorOnly, pollOptions } = c.req.valid('json');
    if (type === 'poll' && (!pollOptions || pollOptions.length < 2)) {
        return c.json({ error: '投票至少需要2个选项。' }, 400);
    }
    const user = c.get('user');
    const now = Math.floor(Date.now() / 1000);
    const db = c.env.DB;

    // 使用事务创建帖子和投票选项
    const results = await db.batch([
        db.prepare(`INSERT INTO Threads (node_id, author_id, title, body, type, read_permission, is_author_only, created_at, last_reply_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(nodeId, user.id, title, body, type, readPermission, isAuthorOnly, now, now)
    ]);
    const newThreadId = results[0].meta.last_row_id;

    if (type === 'poll' && pollOptions) {
        const stmts = pollOptions.map(option =>
            db.prepare(`INSERT INTO PollOptions (thread_id, option_text) VALUES (?, ?)`).bind(newThreadId, option)
        );
        await db.batch(stmts);
    }

    return c.json({ message: '帖子创建成功', threadId: newThreadId }, 201);
});


// 获取单个帖子的详细信息 (已简化)
app.get('/:id', async (c) => {
    const threadId = parseInt(c.req.param('id'), 10);
    const db = c.env.DB;
    const user = c.get('user');

    try {
        const thread = await db.prepare(`SELECT t.*, u.username as author_username, u.avatar as author_avatar, u.level as author_level FROM Threads t JOIN Users u ON t.author_id = u.id WHERE t.id = ?`).bind(threadId).first<ThreadWithAuthor>();
        if (!thread) return c.json({ error: '帖子未找到' }, 404);

        // 权限检查
        if (thread.read_permission) {
            if (!user || thread.read_permission > user.level) {
                return c.json({ error: `您的等级不足，需要达到 Lv.${thread.read_permission} 才能查看此贴。` }, 403);
            }
        }

        let poll_options: PollOption[] | undefined = undefined;
        let user_vote: UserVote | undefined = undefined;

        if (thread.type === 'poll') {
            const { results } = await db.prepare("SELECT * FROM PollOptions WHERE thread_id = ?").bind(threadId).all<PollOption>();
            poll_options = results;
            if (user) {
                const vote = await db.prepare("SELECT poll_option_id FROM PollVotes WHERE thread_id = ? AND user_id = ?").bind(threadId, user.id).first<UserVote>();
                user_vote = vote || undefined;
            }
        }

        const repliesQuery = `
            SELECT r.*, u.username as author_username, u.avatar as author_avatar, qr.body as quoted_body, qu.username as quoted_author, qr.created_at as quoted_created_at
            FROM Replies r
            JOIN Users u ON r.author_id = u.id
            LEFT JOIN Replies qr ON r.reply_to_id = qr.id
            LEFT JOIN Users qu ON qr.author_id = qu.id
            WHERE r.thread_id = ? ORDER BY r.created_at ASC
        `;
        let { results: replies } = await db.prepare(repliesQuery).bind(threadId).all<ReplyWithAuthor>();

        await db.prepare('UPDATE Threads SET view_count = view_count + 1 WHERE id = ?').bind(threadId).run();

        if (thread.is_author_only) {
            if (!user || user.id != thread.author_id) {
                replies = replies.map(reply => {
                    if (!user || reply.author_id != user.id) {
                        reply.body = '';
                    }
                    return reply
                });
            }
        }
        const response: ThreadWithDetails = { ...thread, replies, poll_options, user_vote };
        return c.json(response);
    } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to fetch thread details' }, 500);
    }
});

// 新增: 更新一个主题帖
const updateThreadSchema = z.object({
    title: z.string().min(5, "标题至少需要5个字符"),
    body: z.string().min(10, "内容至少需要10个字符"),
});
app.put('/:threadId', authMiddleware, zValidator('json', updateThreadSchema), async (c) => {
    const threadId = parseInt(c.req.param('threadId'), 10);
    const { title, body } = c.req.valid('json');
    const user = c.get('user')!; // 经过 authMiddleware，user 必定存在
    const db = c.env.DB;

    // 权限检查：只有作者或管理员可以编辑
    const thread = await db.prepare("SELECT author_id FROM Threads WHERE id = ?").bind(threadId).first<{ author_id: string }>();
    if (!thread || (thread.author_id !== user.id && user.role !== 'admin')) {
        return c.json({ error: "您没有权限编辑此帖子" }, 403);
    }

    await db.prepare("UPDATE Threads SET title = ?, body = ? WHERE id = ?").bind(title, body, threadId).run();
    return c.json({ message: "帖子更新成功" });
});

// 投票接口
app.post('/:threadId/vote', authMiddleware, zValidator('json', z.object({ optionId: z.number() })), async (c) => {
    const threadId = parseInt(c.req.param('threadId'), 10);
    const { optionId } = c.req.valid('json');
    const user = c.get('user');
    const db = c.env.DB;

    // 检查是否已投过票
    const existingVote = await db.prepare("SELECT * FROM PollVotes WHERE thread_id = ? AND user_id = ?").bind(threadId, user.id).first();
    if (existingVote) return c.json({ error: '您已经投过票了。' }, 409);

    await db.batch([
        db.prepare("INSERT INTO PollVotes (thread_id, user_id, poll_option_id) VALUES (?, ?, ?)").bind(threadId, user.id, optionId),
        db.prepare("UPDATE PollOptions SET vote_count = vote_count + 1 WHERE id = ?").bind(optionId),
    ]);

    return c.json({ message: '投票成功' });
});


// 发布回复
const createReplySchema = z.object({ body: z.string().min(1), replyToId: z.number().int().positive().nullable() });

app.post('/:threadId/replies', authMiddleware, zValidator('json', createReplySchema), async (c) => {
    const threadId = parseInt(c.req.param('threadId'), 10);
    const { body, replyToId } = c.req.valid('json');
    const user = c.get('user');
    const now = Math.floor(Date.now() / 1000);
    const db = c.env.DB;

    try {
        // 1. 获取原帖作者ID，用于后续创建提醒
        const originalThread = await db.prepare("SELECT author_id FROM Threads WHERE id = ?").bind(threadId).first<{ author_id: string }>();

        if (!originalThread) {
            return c.json({ error: "Thread not found" }, 404);
        }

        const { meta } = await db.prepare(
            `INSERT INTO Replies (thread_id, author_id, created_at, body, reply_to_id) VALUES (?, ?, ?, ?, ?)`
        ).bind(threadId, user.id, now, body, replyToId || null).run(); // 直接插入 body

        const reply = await db.prepare("SELECT * FROM Replies WHERE id = ?").bind(meta.last_row_id).first<Reply>();

        const newReplyId = meta.last_row_id;

        // 2. 更新帖子的最后回复信息，包括 last_reply_id
        await db.prepare(
            `UPDATE Threads SET reply_count = reply_count + 1, last_reply_at = ?, last_reply_user_id = ?, last_reply_id = ? WHERE id = ?`
        ).bind(now, user.id, newReplyId, threadId).run();

        // 3. 使用 batch 更新帖子和版块的回复计数、最后回复时间以及用户积分
        await c.env.DB.batch([
            c.env.DB.prepare(
                `UPDATE Threads 
                 SET reply_count = reply_count + 1, last_reply_at = ?, last_reply_user_id = ? 
                 WHERE id = ?`
            ).bind(now, user.id, threadId),
            c.env.DB.prepare(
                `UPDATE Nodes 
                 SET reply_count = reply_count + 1 
                 WHERE id = (SELECT node_id FROM Threads WHERE id = ?)`
            ).bind(threadId),
            c.env.DB.prepare('UPDATE Credits SET balance = balance + 1, last_updated = ? WHERE user_id = ?').bind(now, user.id)
        ]);

        // 4. 创建提醒 (如果回复者不是原帖作者)
        if (originalThread.author_id !== user.id) {
            await db.prepare(
                `INSERT INTO Reminders (recipient_id, actor_id, thread_id, reply_id, type, created_at)
                VALUES (?, ?, ?, ?, 'reply_to_thread', ?)`
            ).bind(originalThread.author_id, user.id, threadId, newReplyId, now).run();
        }
        return c.json({ message: 'Reply posted successfully', replyId: meta.last_row_id }, 201);

    } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to post reply' }, 500);
    }
});

app.get('/:threadId/replies/:replyId', authMiddleware, async (c) => {
    const replyId = parseInt(c.req.param('replyId'), 10);
    const user = c.get('user')!;
    const db = c.env.DB;

    // 权限检查：只有作者或管理员可以编辑
    const reply = await db.prepare("SELECT * FROM Replies WHERE id = ?").bind(replyId).first<Reply>();
    if (!reply) {
        return c.json({ error: "无此回复" }, 403);
    }
    if (!['admin', 'moderator'].includes(user.role) && reply.author_id != user.id) {
        return c.json({ error: "您没有权限查看此回复" }, 403);
    }

    return c.json(reply);
});

// 新增: 更新一个回帖的路由
const updateReplySchema = z.object({ body: z.string().min(1) });
app.put('/:threadId/replies/:replyId', authMiddleware, zValidator('json', updateReplySchema), async (c) => {
    const replyId = parseInt(c.req.param('replyId'), 10);
    const { body } = c.req.valid('json');
    const user = c.get('user')!;
    const db = c.env.DB;

    // 权限检查：只有作者或管理员可以编辑
    const reply = await db.prepare("SELECT * FROM Replies WHERE id = ?").bind(replyId).first<Reply>();
    if (!['admin', 'moderator'].includes(user.role)) {
        if (!reply || (reply.author_id !== user.id)) {
            return c.json({ error: "您没有权限查看此回复" }, 403);
        }
    }

    await db.prepare("UPDATE Replies SET body = ? WHERE id = ?").bind(body, replyId).run();
    return c.json({ message: "回复更新成功" });
});

export default app;
