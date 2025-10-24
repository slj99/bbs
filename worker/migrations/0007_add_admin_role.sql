-- D1 数据库迁移文件
-- 版本: 0007
-- 描述: 为 Users 表添加角色(role)字段以区分管理员

ALTER TABLE Users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';

-- 手动将某个用户设为管理员 (请替换为您自己的用户名)
-- Passkey 登录不再需要密码
UPDATE Users SET role = 'admin' WHERE username = 'admin';
