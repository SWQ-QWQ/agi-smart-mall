-- 修复 products 表中 category_id 为空的商品
-- 将它们归类到"数码电子"（id=3）

-- 检查有多少商品没有 category_id
SELECT COUNT(*) as count FROM products WHERE category_id IS NULL;

-- 更新没有 category_id 的商品
UPDATE products 
SET category_id = 3 
WHERE category_id IS NULL;

-- 验证修复结果
SELECT p.id, p.title, p.category_id, c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY p.id
LIMIT 20;

-- 检查每个分类下的商品数量
SELECT p.category_id, c.name, COUNT(*) as product_count
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
GROUP BY p.category_id, c.name
ORDER BY p.category_id;