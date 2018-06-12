var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session'); // session

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();
// session配置
app.use(session({
  secret:'blog',
    cookie:{maxAge:1000*60*24*30},
    resave: false,
    saveUninitialized: true
}));

// 设置视图文件夹的位置
app.set('views', path.join(__dirname, 'views'));
// 设置项目使用ejs模板引擎
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// 使用日志记录中间件
app.use(logger('dev'));
// 使用bodyParser中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// 使用cookieParser中间件
app.use(cookieParser());
// 使用express默认的static中间件设置静态文件夹的位置
app.use(express.static(path.join(__dirname, 'public')));

// 使用路由index
app.use('/', index);

// 使用路由users
app.use('/users', users);

// 处理错误程序
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// 错误处理
app.use(function(err, req, res, next) {
  // 设置本地错误信息仅在开发环境中提供
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // 渲染错误请求页面
  res.status(err.status || 500);
  res.render('error');
});

app.listen(3005,function(){
    console.log('listening port 3000');
});
module.exports = app;
