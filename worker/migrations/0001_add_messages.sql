-- D1 数据库迁移文件
-- 版本: 0001
-- 描述: 添加私信功能的表结构

-- 会话表: 存储两个用户之间的对话元数据
CREATE TABLE Conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- 为了确保任意两个用户间只有一个会话，我们将用户ID按字典序存储
    -- user1_id 总是存储ID较小的那个
    user1_id TEXT NOT NULL,
    user2_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_message_at INTEGER NOT NULL,
    last_message_excerpt TEXT, -- 最后一条消息的摘要
    user1_unread_count INTEGER NOT NULL DEFAULT 0,
    user2_unread_count INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user1_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES Users(id) ON DELETE CASCADE,
    -- 确保任意两个用户之间只有一个会话
    UNIQUE (user1_id, user2_id)
);

-- 私信表: 存储具体的每条消息内容
CREATE TABLE PrivateMessages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    author_id TEXT NOT NULL,
    body TEXT NOT NULL, -- 消息正文存储在 R2
    created_at INTEGER NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES Conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES Users(id) ON DELETE CASCADE
);

