import { createMiddleware } from 'hono/factory';
import type { Bindings, User } from '../types';

// 定义中间件将添加到上下文中的变量类型
export type AuthVariables = {
  user: User;
};

// 认证中间件
export const authMiddleware = createMiddleware<{ Bindings: Bindings, Variables: AuthVariables }>(async (c, next) => {
  // 从请求头中获取 Authorization
  const authHeader = c.req.header('Authorization');
  
  // 检查是否存在以及格式是否正确 (Bearer <token>)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or invalid token format' }, 401);
  }

  // 提取 token
  const token = authHeader.split(' ')[1];
  if (!token) {
    return c.json({ error: 'Unauthorized: Token not found' }, 401);
  }

  // 在 KV 中查找会话
  const userId = await c.env.KV_SESSIONS.get(`session:${token}`);
  if (!userId) {
    return c.json({ error: 'Unauthorized: Invalid session' }, 401);
  }

  // 从 D1 中获取用户详细信息
  const user = await c.env.DB.prepare('SELECT id, username, email, created_at, profile_bio, avatar, role FROM Users WHERE id = ?')
   .bind(userId)
   .first<User>();

  if (!user) {
    // 如果用户已被删除但会话仍然存在，则清理会话
    await c.env.KV_SESSIONS.delete(`session:${token}`);
    return c.json({ error: 'Unauthorized: User not found' }, 401);
  }

  // 将用户信息附加到上下文中，供下游处理器使用
  c.set('user', user);

  // 继续处理请求
  await next();
});
