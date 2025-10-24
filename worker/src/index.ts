import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import type { Bindings } from './types';
import auth from './routes/auth';
import nodes from './routes/nodes';
import threads from './routes/threads';
import comments from './routes/comments';
import users from './routes/users';
import messages from './routes/messages';
import reminders from './routes/reminders';
import search from './routes/search';
import rankings from './routes/rankings';
import images from './routes/images';
import config from './routes/config';
import attachments from './routes/attachments'; // 1. 引入新路由
import admin from './routes/admin'; // 1. 引入新路由
import adminNodes from './routes/adminNodes'; // 1. 引入新路由
import adminUserGroups from './routes/adminUserGroups'; // 1. 引入新路由
import adminSettings from './routes/adminSettings'; // 1. 引入新路由
import { tryAuthMiddleware } from './auth/tryAuthMiddleware';

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', logger());
app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:8787', 'https://serverless-bbs.pages.dev', 'https://*.serverless-bbs.pages.dev', 'https://serverless-bbs.anquanssl.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 31560000,
}));

const api = new Hono();

app.use('*', tryAuthMiddleware);

api.route('/auth', auth);
api.route('/nodes', nodes);
api.route('/threads', threads);
api.route('/comments', comments);
api.route('/users', users);
api.route('/messages', messages);
api.route('/messages', messages);
api.route('/reminders', reminders);
api.route('/search', search);
api.route('/rankings', rankings);
api.route('/images', images);
api.route('/attachments', attachments); // 2. 挂载附件上传路由
api.route('/config', config);
api.route('/admin', admin); // 2. 挂载管理员路由
api.route('/admin/nodes', adminNodes); // 2. 挂载版块管理路由
api.route('/admin/groups', adminUserGroups); // 2. 挂载用户组管理路由
api.route('/admin/settings', adminSettings); // 2. 挂载站点设置管理路由

app.get('/r2/:key{.+$}', async (c) => {
  const key = c.req.param('key');
  const object = await c.env.R2_BUCKET.get(key);

  if (object === null) {
    return c.notFound();
  }

  // Use the Cloudflare Workers' Headers class for compatibility with R2
  const headers = new (globalThis as any).Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);

  return new Response(object.body as any, {
    headers,
  });
});

// 新增: 提供附件下载的公共路由
app.get('/attachments/*', async (c) => {
  const key = c.req.path.substring(1);
  const object = await c.env.R2_BUCKET.get(key);
  if (object === null) return c.notFound();

  // Use the Cloudflare Workers' Headers class for compatibility with R2
  const headers = new (globalThis as any).Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  return new Response(object.body as any, { headers });
});

app.route('/api', api);

app.all('*', async (c) => {
  return c.env.ASSETS.fetch(<any> c.req);
});

app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
