-- D1 数据库迁移文件
-- 版本: 0002
-- 描述: 添加帖子提醒功能的表结构

CREATE TABLE Reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_id TEXT NOT NULL, -- 接收提醒的用户 ID
    actor_id TEXT NOT NULL,     -- 触发提醒的用户 ID (例如，回复者)
    thread_id INTEGER NOT NULL, -- 相关的帖子 ID
    reply_id INTEGER,           -- 相关的回复 ID (可选)
    type TEXT NOT NULL,         -- 提醒类型, e.g., 'reply_to_thread'
    is_read BOOLEAN NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (recipient_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (thread_id) REFERENCES Threads(id) ON DELETE CASCADE
);
