-- D1 数据库迁移文件
-- 版本: 0005
-- 描述: 添加帖子类型、阅读权限和用户等级功能

-- D1 不支持在单个事务中修改多个表或添加带复杂约束的列，
-- 因此我们使用 PRAGMA 和分步操作。

PRAGMA foreign_keys=off;

-- 1. 为 Users 表添加 level 字段
CREATE TABLE Users_new (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL,
    profile_bio TEXT,
    avatar TEXT,
    level INTEGER NOT NULL DEFAULT 1 -- 新增：用户等级字段
);
INSERT INTO Users_new (id, username, email, created_at, profile_bio, avatar)
SELECT id, username, email, created_at, profile_bio, avatar FROM Users;
DROP TABLE Users;
ALTER TABLE Users_new RENAME TO Users;

-- 2. 为 Threads 表添加新字段
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
    type TEXT NOT NULL DEFAULT 'discussion', -- 新增：帖子类型 (discussion, poll)
    read_permission INTEGER NOT NULL DEFAULT 0, -- 新增：阅读权限等级
    FOREIGN KEY (node_id) REFERENCES Nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES Users(id) ON DELETE CASCADE
);
-- 迁移旧数据
INSERT INTO Threads_new (id, node_id, author_id, title, body, created_at, last_reply_at, last_reply_user_id, view_count, reply_count, is_pinned, is_locked)
SELECT id, node_id, author_id, title, body, created_at, last_reply_at, last_reply_user_id, view_count, reply_count, is_pinned, is_locked FROM Threads;
DROP TABLE Threads;
ALTER TABLE Threads_new RENAME TO Threads;

-- 3. 创建投票相关的新表
CREATE TABLE PollOptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    vote_count INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (thread_id) REFERENCES Threads(id) ON DELETE CASCADE
);

CREATE TABLE PollVotes (
    thread_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    poll_option_id INTEGER NOT NULL,
    PRIMARY KEY (thread_id, user_id), -- 一个用户在一个投票中只能投一次
    FOREIGN KEY (thread_id) REFERENCES Threads(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (poll_option_id) REFERENCES PollOptions(id) ON DELETE CASCADE
);


PRAGMA foreign_keys=on;
