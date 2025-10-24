-- D1 数据库迁移文件
-- 版本: 0006
-- 描述: 为帖子和回复添加 is_author_only 字段

PRAGMA foreign_keys=off;

-- 1. 为 Threads 表添加新字段
CREATE TABLE Threads_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id INTEGER NOT NULL,
    author_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    created_at INTEGER NOT NULL,
    last_reply_at INTEGER,
    last_reply_user_id TEXT,
    last_reply_id INTEGER,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT 0,
    is_locked BOOLEAN DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'discussion',
    read_permission INTEGER NOT NULL DEFAULT 0,
    is_author_only BOOLEAN NOT NULL DEFAULT 0, -- 新增字段
    FOREIGN KEY (node_id) REFERENCES Nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES Users(id) ON DELETE CASCADE
);
INSERT INTO Threads_new (id, node_id, author_id, title, body, created_at, last_reply_at, last_reply_user_id, last_reply_id, view_count, reply_count, is_pinned, is_locked, type, read_permission)
SELECT id, node_id, author_id, title, body, created_at, last_reply_at, last_reply_user_id, last_reply_id, view_count, reply_count, is_pinned, is_locked, type, read_permission FROM Threads;
DROP TABLE Threads;
ALTER TABLE Threads_new RENAME TO Threads;


-- 2. 为 Replies 表添加新字段
CREATE TABLE Replies_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    author_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    body TEXT,
    reply_to_id INTEGER,
    is_author_only BOOLEAN NOT NULL DEFAULT 0, -- 新增字段
    FOREIGN KEY (thread_id) REFERENCES Threads(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES Replies(id) ON DELETE SET NULL
);
INSERT INTO Replies_new (id, thread_id, author_id, created_at, body, reply_to_id)
SELECT id, thread_id, author_id, created_at, body, reply_to_id FROM Replies;
DROP TABLE Replies;
ALTER TABLE Replies_new RENAME TO Replies;


PRAGMA foreign_keys=on;
