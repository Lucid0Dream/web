-- 创建数据库
CREATE DATABASE IF NOT EXISTS shop_system DEFAULT CHARSET utf8mb4;
USE shop_system;

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL
);

-- 商品表
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(255),
  category_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 用户需求表
CREATE TABLE IF NOT EXISTS user_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT '未处理',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL
);

-- 插入初始分类
INSERT INTO categories (name) VALUES
('烟机灶具'),
('水暖电器'),
('水管配件'),
('五金配件');

-- 插入管理员账号（密码为明文zz0410，后续建议加密）
INSERT INTO admins (username, password) VALUES ('zz', 'zz0410'); 