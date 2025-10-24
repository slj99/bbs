import { Hono } from 'hono';
import type { Bindings, NodeWithLastPost } from '../types'; // 引入新的类型

const app = new Hono<{ Bindings: Bindings }>();

// 获取所有节点 (版块)，并附带最后发表的帖子信息
app.get('/', async (c) => {
  try {
    // 这条 SQL 查询使用了子查询来为每个节点(n)找到
    // 相应节点(t.node_id = n.id)中，
    // last_reply_at 时间最新的那个帖子的标题、ID和时间。
    const query = `
      SELECT
          n.id,
          n.name,
          n.description,
          n.parent_node_id,
          n.sort_order,
          n.thread_count,
          n.reply_count,
          (SELECT t.title FROM Threads t WHERE t.node_id = n.id ORDER BY t.last_reply_at DESC LIMIT 1) as last_post_title,
          (SELECT t.id FROM Threads t WHERE t.node_id = n.id ORDER BY t.last_reply_at DESC LIMIT 1) as last_post_thread_id,
          (SELECT t.last_reply_at FROM Threads t WHERE t.node_id = n.id ORDER BY t.last_reply_at DESC LIMIT 1) as last_post_time,
          (SELECT t.last_reply_id FROM Threads t WHERE t.node_id = n.id ORDER BY t.last_reply_id DESC LIMIT 1) as last_reply_id
      FROM
          Nodes n
      ORDER BY
          n.sort_order ASC
    `;

    const { results } = await c.env.DB.prepare(query).all<NodeWithLastPost>();
    
    return c.json(results || []);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Failed to fetch nodes' }, 500);
  }
});

// 获取单个节点信息 (这个路由保持不变)
app.get('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const node = await c.env.DB.prepare(
      'SELECT id, name, description, parent_node_id, thread_count, reply_count FROM Nodes WHERE id = ?'
    ).bind(id).first();

    if (!node || !node.parent_node_id) {
      return c.json({ error: 'Node not found' }, 404);
    }
    return c.json(node);
  } catch(e) {
    console.error(e);
    return c.json({ error: 'Failed to fetch node' }, 500);
  }
});


export default app;
