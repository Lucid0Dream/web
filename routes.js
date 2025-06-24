const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '0410',
  database: 'shop_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
const jwt = require('jsonwebtoken');

// 商品相关API
// ... 预留

// 分类相关API
// ... 预留

// 用户需求相关API
// ... 预留

// 管理员相关API
// ... 预留

// 图片上传配置
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

const jwtSecret = 'shop_system_secret'; // 可根据需要更换

// 获取商品列表（可选分类）
router.get('/products', (req, res) => {
  const { category_id } = req.query;
  let sql = 'SELECT * FROM products';
  let params = [];
  if (category_id) {
    sql += ' WHERE category_id = ?';
    params.push(category_id);
  }
  pool.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 添加商品（含图片上传）
router.post('/products', upload.single('image'), (req, res) => {
  const { name, price, category_id } = req.body;
  const image_url = req.file ? '/uploads/' + req.file.filename : '';
  pool.query(
    'INSERT INTO products (name, price, image_url, category_id) VALUES (?, ?, ?, ?)',
    [name, price, image_url, category_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, name, price, image_url, category_id });
    }
  );
});

// 修改商品
router.put('/products/:id', upload.single('image'), (req, res) => {
  const { name, price, category_id } = req.body;
  const { id } = req.params;
  let sql = 'UPDATE products SET name=?, price=?, category_id=?';
  let params = [name, price, category_id];
  if (req.file) {
    sql += ', image_url=?';
    params.push('/uploads/' + req.file.filename);
  }
  sql += ' WHERE id=?';
  params.push(id);
  pool.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 删除商品
router.delete('/products/:id', (req, res) => {
  const { id } = req.params;
  pool.query('DELETE FROM products WHERE id=?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 获取所有分类
router.get('/categories', (req, res) => {
  pool.query('SELECT * FROM categories', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 新增分类
router.post('/categories', (req, res) => {
  const { name } = req.body;
  pool.query('INSERT INTO categories (name) VALUES (?)', [name], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, name });
  });
});

// 修改分类
router.put('/categories/:id', (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  pool.query('UPDATE categories SET name=? WHERE id=?', [name, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 删除分类
router.delete('/categories/:id', (req, res) => {
  const { id } = req.params;
  pool.query('DELETE FROM categories WHERE id=?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 用户提交需求
router.post('/requests', (req, res) => {
  const { name, phone, content } = req.body;
  pool.query(
    'INSERT INTO user_requests (name, phone, content) VALUES (?, ?, ?)',
    [name, phone, content],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, name, phone, content, status: '未处理' });
    }
  );
});

// 获取所有用户需求（管理员用）
router.get('/requests', (req, res) => {
  pool.query('SELECT * FROM user_requests', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 标记需求为已处理
router.put('/requests/:id', (req, res) => {
  const { id } = req.params;
  pool.query('UPDATE user_requests SET status="已处理" WHERE id=?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 删除需求
router.delete('/requests/:id', (req, res) => {
  const { id } = req.params;
  pool.query('DELETE FROM user_requests WHERE id=?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 管理员登录
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  pool.query('SELECT * FROM admins WHERE username=?', [username], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(401).json({ error: '账号不存在' });
    const admin = results[0];
    // 明文密码对比（如需加密可用bcrypt）
    if (password !== admin.password) return res.status(401).json({ error: '密码错误' });
    const token = jwt.sign({ id: admin.id, username: admin.username }, jwtSecret, { expiresIn: '12h' });
    res.json({ token });
  });
});

// 管理员鉴权中间件
function adminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: '未登录' });
  const token = auth.split(' ')[1];
  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) return res.status(401).json({ error: '无效token' });
    req.admin = decoded;
    next();
  });
}

module.exports = router; 