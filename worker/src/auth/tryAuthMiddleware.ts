import { createMiddleware } from 'hono/factory';
import type { Bindings, User } from '../types';

// 定义中间件将添加到上下文中的变量类型
type AuthVariables = {
  user?: User; // 用户信息现在是可选的
};

// "可选认证"中间件
export const tryAuthMiddleware = createMiddleware<{ Bindings: Bindings, Variables: AuthVariables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.split(' ')?.[1];
  // 如果没有 token，直接进入下一个处理器
  if (!token) {
    return next();
  }
  
  const userId = await c.env.KV_SESSIONS.get(`session:${token}`);
  if (!userId) {
    return next();
  }

  // 从 D1 中获取用户详细信息
  const user = await c.env.DB.prepare('SELECT id, username, email, created_at, profile_bio, avatar, role FROM Users WHERE id = ?')
   .bind(userId)
   .first<User>();

  if (user) {
    // 如果用户有效，则将其信息设置到上下文中
    c.set('user', user);
  }

  // 无论是否认证成功，都继续处理请求
  await next();
});
