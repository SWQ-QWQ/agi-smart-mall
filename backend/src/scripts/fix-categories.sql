-- 确保categories表有show_in_nav列
-- 防止启动时出现"Unknown column 'show_in_nav' in 'field list'"错误

-- 添加show_in_nav列（如果不存在）
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS show_in_nav TINYINT DEFAULT 1;

-- 为现有分类设置默认值
UPDATE categories SET show_in_nav = 1 WHERE show_in_nav IS NULL;

-- 验证修改
SELECT id, name, show_in_nav FROM categories ORDER BY id;