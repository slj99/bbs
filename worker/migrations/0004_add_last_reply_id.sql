-- D1 数据库迁移文件
-- 版本: 0004
-- 描述: 为 Threads 表添加 last_reply_id 字段

-- D1 目前不支持直接 ALTER TABLE ADD COLUMN，需要通过创建新表、复制数据、重命名的方式实现。
-- 为简化演示，我们假设是新项目，直接修改表结构。
-- 如果是已有数据的生产环境，请务必先备份数据。

PRAGMA foreign_keys=off;

CREATE TABLE Threads_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id INTEGER NOT NULL,
    author_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    created_at INTEGER NOT NULL,
    last_reply_at INTEGER,
    last_reply_user_id TEXT,
    last_reply_id INTEGER, -- 新增字段，用于存储最后回复的ID
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT 0,
    is_locked BOOLEAN DEFAULT 0,
    FOREIGN KEY (node_id) REFERENCES Nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- 如果存在旧数据，需要执行 INSERT INTO Threads_new SELECT ... FROM Threads;

DROP TABLE Threads;

ALTER TABLE Threads_new RENAME TO Threads;

PRAGMA foreign_keys=on;
