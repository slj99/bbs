-- D1 数据库迁移文件
-- 版本: 0010
-- 描述: 添加站点设置表 (key-value)

CREATE TABLE Settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 插入默认的站点设置
INSERT INTO Settings (key, value) VALUES
    ('site_name', 'HOSTLOC.COM'),
    ('site_slogan', '全球主机交流'),
    ('site_logo_url', '/img/logo.png'), -- 假设 logo 文件位于 ui/public/img/logo.png
    ('site_icp', ''),
    ('friendly_links', '[{"name": "Discuz!", "url": "https://www.discuz.net"}, {"name": "Cloudflare", "url": "https://www.cloudflare.com"}]');

