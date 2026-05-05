-- =========================================================
-- 智享商城 - 商品分类匹配修复脚本
-- =========================================================
-- 执行前请确认：
-- 1. 数据库连接正确
-- 2. 商品表和分类表存在
-- =========================================================

-- 1. 先检查当前分类和商品情况
SELECT '当前分类信息' AS info;
SELECT id, name FROM categories ORDER BY id;

SELECT '商品分类统计' AS info;
SELECT p.category_id, c.name AS category_name, COUNT(*) AS product_count
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
GROUP BY p.category_id, c.name
ORDER BY p.category_id;

-- 2. 定义分类匹配规则
-- 分类ID: 1 = 生活家居 (收纳整理、香薰蜡烛、家居饰品、床上用品、台灯、收纳盒、宜家、无印良品)
-- 分类ID: 2 = 运动户外 (361°、特步、匹克、安踏、斐乐、李宁、阿迪达斯、耐克、运动鞋、运动帽、健身、跑步、瑜伽)
-- 分类ID: 3 = 数码电子 (手机、电脑、耳机、键盘、鼠标、音箱、手表、平板、充电宝、数据线、小米、华为、苹果、三星、索尼)
-- 分类ID: 4 = 家用电器 (洗衣机、冰箱、空调、电饭煲、加湿器、吸尘器、美的、格力、海尔)
-- 分类ID: 5 = 家具家装 (沙发、床、桌子、椅子、柜子、灯具)
-- 分类ID: 6 = 美妆个护 (口红、粉底、香水、面膜、眼影、护肤品、兰蔻、雅诗兰黛、资生堂)
-- 分类ID: 7 = 餐厨水具 (锅具、刀具、餐具、水杯、保温杯、双立人、苏泊尔、虎牌)
-- 分类ID: 8 = 图书文具 (图书、笔记本、钢笔、文具套装、画材、晨光、得力、三菱)

-- 3. 更新商品分类 - 生活家居 (id=1)
UPDATE products 
SET category_id = 1 
WHERE category_id IS NULL 
   OR category_id NOT IN (1,2,3,4,5,6,7,8)
   OR (
     (title LIKE '%收纳%' OR title LIKE '%家居%' OR title LIKE '%香薰%' OR title LIKE '%蜡烛%' 
      OR title LIKE '%饰品%' OR title LIKE '%床上%' OR title LIKE '%台灯%' 
      OR title LIKE '%收纳盒%' OR brand LIKE '%宜家%' OR brand LIKE '%无印%')
     AND NOT (title LIKE '%手机%' OR title LIKE '%电脑%' OR title LIKE '%耳机%'
              OR title LIKE '%运动%' OR title LIKE '%健身%' OR title LIKE '%跑步%')
   );

-- 4. 更新商品分类 - 运动户外 (id=2)
UPDATE products 
SET category_id = 2 
WHERE (
  title LIKE '%361°%' OR title LIKE '%特步%' OR title LIKE '%匹克%' OR title LIKE '%安踏%' 
  OR title LIKE '%斐乐%' OR title LIKE '%李宁%' OR title LIKE '%阿迪达斯%' OR title LIKE '%耐克%'
  OR title LIKE '%运动鞋%' OR title LIKE '%运动帽%' OR title LIKE '%运动%' 
  OR title LIKE '%健身%' OR title LIKE '%跑步%' OR title LIKE '%瑜伽%'
  OR brand LIKE '%361°%' OR brand LIKE '%特步%' OR brand LIKE '%匹克%' OR brand LIKE '%安踏%'
  OR brand LIKE '%斐乐%' OR brand LIKE '%李宁%' OR brand LIKE '%阿迪达斯%' OR brand LIKE '%耐克%'
)
AND category_id != 2;

-- 5. 更新商品分类 - 数码电子 (id=3)
UPDATE products 
SET category_id = 3 
WHERE (
  title LIKE '%手机%' OR title LIKE '%电脑%' OR title LIKE '%耳机%' OR title LIKE '%键盘%'
  OR title LIKE '%鼠标%' OR title LIKE '%音箱%' OR title LIKE '%手表%' OR title LIKE '%平板%'
  OR title LIKE '%充电宝%' OR title LIKE '%数据线%' OR title LIKE '%数码%' OR title LIKE '%电子%'
  OR brand LIKE '%小米%' OR brand LIKE '%华为%' OR brand LIKE '%苹果%' OR brand LIKE '%三星%' OR brand LIKE '%索尼%'
)
AND category_id != 3;

-- 6. 更新商品分类 - 家用电器 (id=4)
UPDATE products 
SET category_id = 4 
WHERE (
  title LIKE '%洗衣机%' OR title LIKE '%冰箱%' OR title LIKE '%空调%' OR title LIKE '%电饭煲%'
  OR title LIKE '%加湿器%' OR title LIKE '%吸尘器%' OR title LIKE '%家电%' OR title LIKE '%电器%'
  OR brand LIKE '%美的%' OR brand LIKE '%格力%' OR brand LIKE '%海尔%'
)
AND category_id != 4;

-- 7. 更新商品分类 - 家具家装 (id=5)
UPDATE products 
SET category_id = 5 
WHERE (
  title LIKE '%沙发%' OR title LIKE '%床%' OR title LIKE '%桌子%' OR title LIKE '%椅子%'
  OR title LIKE '%柜子%' OR title LIKE '%灯具%' OR title LIKE '%家具%' OR title LIKE '%家装%'
)
AND category_id != 5;

-- 8. 更新商品分类 - 美妆个护 (id=6)
UPDATE products 
SET category_id = 6 
WHERE (
  title LIKE '%口红%' OR title LIKE '%粉底%' OR title LIKE '%香水%' OR title LIKE '%面膜%'
  OR title LIKE '%眼影%' OR title LIKE '%护肤%' OR title LIKE '%美妆%' OR title LIKE '%彩妆%'
  OR brand LIKE '%兰蔻%' OR brand LIKE '%雅诗兰黛%' OR brand LIKE '%资生堂%'
)
AND category_id != 6;

-- 9. 更新商品分类 - 餐厨水具 (id=7)
UPDATE products 
SET category_id = 7 
WHERE (
  title LIKE '%锅具%' OR title LIKE '%刀具%' OR title LIKE '%餐具%' OR title LIKE '%水杯%'
  OR title LIKE '%保温杯%' OR title LIKE '%厨房%' OR title LIKE '%餐具%' OR title LIKE '%水具%'
  OR brand LIKE '%双立人%' OR brand LIKE '%苏泊尔%' OR brand LIKE '%虎牌%'
)
AND category_id != 7;

-- 10. 更新商品分类 - 图书文具 (id=8)
UPDATE products 
SET category_id = 8 
WHERE (
  title LIKE '%图书%' OR title LIKE '%笔记本%' OR title LIKE '%钢笔%' OR title LIKE '%文具%'
  OR title LIKE '%画材%' OR title LIKE '%书籍%'
  OR brand LIKE '%晨光%' OR brand LIKE '%得力%' OR brand LIKE '%三菱%'
)
AND category_id != 8;

-- 11. 再次检查并修复没有匹配到任何分类的商品，分配到数码电子 (id=3)
UPDATE products 
SET category_id = 3 
WHERE category_id IS NULL 
   OR category_id NOT IN (1,2,3,4,5,6,7,8);

-- 12. 显示修复结果
SELECT '修复后分类统计' AS info;
SELECT p.category_id, c.name AS category_name, COUNT(*) AS product_count
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
GROUP BY p.category_id, c.name
ORDER BY p.category_id;

SELECT '修复后前20个商品示例' AS info;
SELECT p.id, p.title, p.brand, p.category_id, c.name AS category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY p.id
LIMIT 20;

SELECT '修复完成！' AS info;
