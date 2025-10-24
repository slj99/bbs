-- D1 数据库迁移文件
-- 版本: 0000
-- 描述: 初始化数据库结构

-- 删除已存在的表 (用于开发环境重置)
DROP TABLE IF EXISTS Comments;
DROP TABLE IF EXISTS Replies;
DROP TABLE IF EXISTS Threads;
DROP TABLE IF EXISTS Nodes;
DROP TABLE IF EXISTS Passkeys;
DROP TABLE IF EXISTS Credits;
DROP TABLE IF EXISTS Users;

-- 用户管理
CREATE TABLE Users (
    id TEXT PRIMARY KEY, -- 使用 UUID 以便未来进行数据库分片
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL,
    profile_bio TEXT,
    avatar TEXT -- 指向 R2 中用户头像的键
);

CREATE TABLE Credits (
    user_id TEXT PRIMARY KEY,
    balance INTEGER NOT NULL DEFAULT 0,
    last_updated INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Passkeys (
    id TEXT PRIMARY KEY, -- WebAuthn 凭证 ID (base64url 格式)
    user_id TEXT NOT NULL,
    pubkey_blob BLOB NOT NULL, -- COSE 编码的公钥
    sign_counter INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- 论坛结构
CREATE TABLE Nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    parent_node_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    thread_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    FOREIGN KEY (parent_node_id) REFERENCES Nodes(id) ON DELETE SET NULL
);

CREATE TABLE Threads (
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
    body TEXT NOT NULL, -- 指向 R2 中帖子正文的键
    FOREIGN KEY (node_id) REFERENCES Nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    author_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    body TEXT NOT NULL, -- 指向 R2 中回复正文的键
    reply_to_id INTEGER, -- 用于引用其他回复，可为空
    FOREIGN KEY (thread_id) REFERENCES Threads(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES Replies(id) ON DELETE SET NULL
);

CREATE TABLE Comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_type TEXT NOT NULL CHECK(parent_type IN ('thread', 'reply')), -- 'thread' 或 'reply'
    parent_id INTEGER NOT NULL, -- 被评论的帖子或回复的 ID
    author_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    body TEXT NOT NULL, -- 指向 R2 中评论正文的键
    FOREIGN KEY (author_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- 插入一些初始的节点数据 (版块)
INSERT INTO Nodes (name, description) VALUES ('主讨论区', '所有一般性讨论都在这里。');
INSERT INTO Nodes (name, description) VALUES ('技术分享', '分享您的技术知识和项目。');
INSERT INTO Nodes (name, description, parent_node_id) VALUES ('Web 开发', '关于前端和后端的讨论。', 2);
INSERT INTO Nodes (name, description, parent_node_id) VALUES ('Cloudflare', '关于 Workers, D1, R2 等的讨论。', 2);
INSERT INTO Nodes (name, description) VALUES ('站务公告', '论坛的重要公告和规则。');
