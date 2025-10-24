import { Hono } from 'hono';
import type { Bindings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

// 定义一个通用的排行类型
type RankingItem = {
    id: number;
    title: string;
    author_username: string;
};

// 获取排行榜数据
app.get('/', async (c) => {
    const db = c.env.DB;
    
    try {
        // 帖子排行：按回复数排序
        const threadsQuery = `
            SELECT t.id, t.title, u.username as author_username
            FROM Threads t
            JOIN Users u ON t.author_id = u.id
            ORDER BY t.reply_count DESC
            LIMIT 10
        `;
        const { results: topThreads } = await db.prepare(threadsQuery).all<RankingItem>();
        
        // 投票排行：按总票数排序
        const pollsQuery = `
            SELECT 
                t.id, 
                t.title, 
                u.username as author_username,
                (SELECT SUM(po.vote_count) FROM PollOptions po WHERE po.thread_id = t.id) as total_votes
            FROM Threads t
            JOIN Users u ON t.author_id = u.id
            WHERE t.type = 'poll'
            ORDER BY total_votes DESC
            LIMIT 10
        `;
        const { results: topPolls } = await db.prepare(pollsQuery).all<RankingItem>();

        return c.json({
            threads: topThreads,
            polls: topPolls,
        });
        
    } catch (e) {
        console.error(e);
        return c.json({ error: '获取排行榜数据时发生错误' }, 500);
    }
});

export default app;
