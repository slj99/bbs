import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Bindings } from '../types';
import { adminAuthMiddleware } from './admin';

const app = new Hono<{ Bindings: Bindings }>();
app.use('/*', adminAuthMiddleware);

// 获取所有用户组
app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM UserGroups ORDER BY points_required ASC").all();
  return c.json(results);
});

// 批量更新用户组
const userGroupSchema = z.object({
  id: z.number().optional(), // 现有组有ID
  level_id: z.number(),
  name: z.string().min(1),
  icon: z.string().optional(),
  points_required: z.number(),
});
const updateUserGroupsSchema = z.object({
  groups: z.array(userGroupSchema)
});

app.put('/', zValidator('json', updateUserGroupsSchema), async (c) => {
  const { groups } = c.req.valid('json');
  const db = c.env.DB;

  const stmts = groups.map(group => {
    if (group.id) {
      return db.prepare("UPDATE UserGroups SET level_id = ?, name = ?, icon = ?, points_required = ? WHERE id = ?")
        .bind(group.level_id, group.name, group.icon, group.points_required, group.id);
    } else {
      return db.prepare("INSERT INTO UserGroups (level_id, name, icon, points_required) VALUES (?, ?, ?, ?)")
        .bind(group.level_id, group.name, group.icon, group.points_required);
    }
  });

  await db.batch(stmts);
  return c.json({ message: "用户组已更新" });
});

// 删除用户组
app.delete('/:id', async (c) => {
  const { id } = c.req.param();
  await c.env.DB.prepare("DELETE FROM UserGroups WHERE id = ?").bind(id).run();
  return c.json({ message: "用户组已删除" });
});

app.get('/:levelId/permissions', async (c) => {
    const { levelId } = c.req.param();
    let permissions = await c.env.DB.prepare("SELECT * FROM UserGroupPermissions WHERE level_id = ?").bind(levelId).first();
    
    // 如果权限不存在，则创建默认权限
    if (!permissions) {
        await c.env.DB.prepare("INSERT INTO UserGroupPermissions (level_id) VALUES (?)").bind(levelId).run();
        permissions = await c.env.DB.prepare("SELECT * FROM UserGroupPermissions WHERE level_id = ?").bind(levelId).first();
    }
    
    return c.json(permissions);
});

// 新增: 更新特定用户组的权限
const permissionsSchema = z.object({
    can_visit: z.boolean(),
    can_view_ip: z.boolean(),
    can_post_thread: z.boolean(),
    can_post_reply: z.boolean(),
    can_send_message: z.boolean(),
    daily_message_limit: z.number().int(),
    can_start_poll: z.boolean(),
    can_vote_poll: z.boolean(),
});
app.put('/:levelId/permissions', zValidator('json', permissionsSchema), async (c) => {
    const { levelId } = c.req.param();
    const perms = c.req.valid('json');
    
    const query = `
        UPDATE UserGroupPermissions SET 
        can_visit = ?, can_view_ip = ?, can_post_thread = ?, can_post_reply = ?, 
        can_send_message = ?, daily_message_limit = ?, can_start_poll = ?, can_vote_poll = ?
        WHERE level_id = ?
    `;
    
    await c.env.DB.prepare(query).bind(
        perms.can_visit, perms.can_view_ip, perms.can_post_thread, perms.can_post_reply,
        perms.can_send_message, perms.daily_message_limit, perms.can_start_poll, perms.can_vote_poll,
        levelId
    ).run();

    return c.json({ message: "权限已更新" });
});

export default app;
