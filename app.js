const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = 3001;

// MySQL连接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '0410',
  database: 'shop_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 启动时自动插入管理员账号
pool.query("SELECT * FROM admins WHERE username = 'zz'", (err, results) => {
  if (err) {
    console.error('检查管理员账号出错:', err.message);
  } else if (results.length === 0) {
    pool.query("INSERT INTO admins (username, password) VALUES ('zz', 'zz0410')", err2 => {
      if (err2) {
        console.error('插入管理员账号失败:', err2.message);
      } else {
        console.log('已自动插入默认管理员账号：zz/zz0410');
      }
    });
  }
});

// 允许跨域
app.use(cors());
// 解析json
app.use(express.json());
// 解析表单
app.use(express.urlencoded({ extended: true }));
// 静态资源（图片上传目录）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 测试API
app.get('/api/ping', (req, res) => {
  res.json({ msg: 'pong' });
});

// 路由注册
app.use('/api', routes);

// 监听
app.listen(PORT, () => {
  console.log(`服务器已启动，端口：${PORT}`);
}); 