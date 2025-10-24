import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Bindings } from '../types';
import { adminAuthMiddleware } from './admin';

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', adminAuthMiddleware);

// 获取所有版块
app.get('/', async (c) => {
    const { results } = await c.env.DB.prepare("SELECT * FROM Nodes ORDER BY parent_node_id, sort_order ASC").all();
    return c.json(results);
});

// 批量更新或创建版块
const nodeSchema = z.object({
    id: z.union([z.number(), z.string()]), // id可以是数字（已存在）或字符串（新）
    sort_order: z.number(),
    name: z.string().min(1),
    parent_node_id: z.number().nullable(),
});
const updateNodesSchema = z.object({
    nodes: z.array(nodeSchema)
});
app.put('/', zValidator('json', updateNodesSchema), async (c) => {
    const { nodes } = c.req.valid('json');
    const db = c.env.DB;
    
    const statements = nodes.map(node => {
        if (typeof node.id === 'number') {
            // 更新现有版块
            return db.prepare("UPDATE Nodes SET name = ?, sort_order = ?, parent_node_id = ? WHERE id = ?")
                     .bind(node.name, node.sort_order, node.parent_node_id, node.id);
        } else {
            // 创建新版块
            return db.prepare("INSERT INTO Nodes (name, sort_order, parent_node_id) VALUES (?, ?, ?)")
                     .bind(node.name, node.sort_order, node.parent_node_id);
        }
    });

    await db.batch(statements);
    return c.json({ message: "版块已更新" });
});

// 删除版块
app.delete('/:id', async (c) => {
    const { id } = c.req.param();
    // 注意：删除分类会将其下的所有子版块的 parent_node_id 设为 null
    await c.env.DB.prepare("DELETE FROM Nodes WHERE id = ?").bind(id).run();
    return c.json({ message: "版块已删除" });
});

export default app;
