-- D1 数据库迁移文件
-- 版本: 0009
-- 描述: 添加用户组权限表

CREATE TABLE UserGroupPermissions (
    level_id INTEGER PRIMARY KEY, -- 对应 UserGroups.level_id
    
    -- 基本权限
    can_visit BOOLEAN NOT NULL DEFAULT 1,
    can_view_ip BOOLEAN NOT NULL DEFAULT 0,
    
    -- 内容发布权限
    can_post_thread BOOLEAN NOT NULL DEFAULT 1,
    can_post_reply BOOLEAN NOT NULL DEFAULT 1,
    post_requires_moderation BOOLEAN NOT NULL DEFAULT 0,

    -- 消息权限
    can_send_message BOOLEAN NOT NULL DEFAULT 1,
    daily_message_limit INTEGER NOT NULL DEFAULT 10,

    -- 投票权限
    can_start_poll BOOLEAN NOT NULL DEFAULT 1,
    can_vote_poll BOOLEAN NOT NULL DEFAULT 1,
    
    FOREIGN KEY (level_id) REFERENCES UserGroups(level_id) ON DELETE CASCADE
);

-- 为已存在的用户组插入默认权限
INSERT INTO UserGroupPermissions (level_id) SELECT level_id FROM UserGroups;

-- 为管理员组（假设 level_id = 16，根据实际情况调整）设置更高权限
-- UPDATE UserGroupPermissions SET can_view_ip = 1, daily_message_limit = 999 WHERE level_id = 16;
