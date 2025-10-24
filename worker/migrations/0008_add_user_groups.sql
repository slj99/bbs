-- D1 数据库迁移文件
-- 版本: 0008
-- 描述: 添加用户组/等级系统

CREATE TABLE UserGroups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level_id INTEGER UNIQUE NOT NULL, -- 等级编号
    name TEXT NOT NULL,
    icon TEXT, -- 用于显示星级等图标的文本
    points_required INTEGER NOT NULL UNIQUE -- 升级到此等级所需积分
);

-- 根据截图插入默认的用户组数据
INSERT INTO UserGroups (level_id, name, icon, points_required) VALUES
(8, '新用户审核', '★', -50),
(9, '新手', '★★', 50),
(10, '优等生', '★★★', 100),
(11, '硕士', '★', 300),
(12, '圣骑士', '★★', 600),
(13, '精灵王', '★★★', 1000),
(14, '风云使者', '★', 5000),
(15, '光明使者', '★★', 10000);

