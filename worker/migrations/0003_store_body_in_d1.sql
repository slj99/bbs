-- D1 数据库迁移文件
-- 版本: 0003
-- 描述: 修改 Threads 和 Replies 表，将正文直接存入 D1

-- 注意: D1 不支持直接 `ALTER TABLE ... DROP COLUMN` 或 `ALTER COLUMN`。
-- 标准做法是：创建一个新表，复制数据，然后重命名。

-- 修改 Replies 表
CREATE TABLE Replies_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    author_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    body TEXT, -- 将 body_r2_key 替换为 body
    reply_to_id INTEGER,
    FOREIGN KEY (thread_id) REFERENCES Threads(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES Replies(id) ON DELETE SET NULL
);
-- 如果有旧数据需要迁移，可以在这里写 INSERT INTO ... SELECT ...
DROP TABLE Replies;
ALTER TABLE Replies_new RENAME TO Replies;

-- 修改 Threads 表
CREATE TABLE Threads_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id INTEGER NOT NULL,
    author_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_reply_at INTEGER,
    last_reply_user_id TEXT,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT 0,
    is_locked BOOLEAN DEFAULT 0,
    body TEXT, -- 将 body_r2_key 替换为 body
    FOREIGN KEY (node_id) REFERENCES Nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES Users(id) ON DELETE CASCADE
);
-- 如果有旧数据需要迁移，可以在这里写 INSERT INTO ... SELECT ...
DROP TABLE Threads;
ALTER TABLE Threads_new RENAME TO Threads;

