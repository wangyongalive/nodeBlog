var express = require('express');
var router = express.Router();
var crypto = require('crypto'); // 加密
const mysql = require('./../database');
/* 首页 */
router.get('/', function (req, res, next) {
    var page = req.query.page || 1;
    var start = (page - 1) * 8;
    var end = page * 8;
    var queryCount = 'SELECT COUNT(*) AS articleNum FROM article'
    // 根据id排序
    var queryArticle = 'SELECT * FROM article ORDER BY articleID DESC LIMIT ' + start + ',' + end;
    var articles;
    mysql.query(queryArticle, function (err, rows, fields) {
         articles = rows;
        // 修改国际标准时间
        articles.forEach(function (ele) {
            var year = ele.articleTime.getFullYear();
            var month = ele.articleTime.getMonth() + 1 > 10 ? ele.articleTime.getMonth() : '0' + (ele.articleTime.getMonth() + 1);
            var date = ele.articleTime.getDate() > 10 ? ele.articleTime.getDate() : '0' + ele.articleTime.getDate();
            ele.articleTime = year + '-' + month + '-' + date;
        });

    });
    mysql.query(queryCount,function (err,rows,fields) {
        var articleNum = rows[0].articleNum;
        var pageNum = Math.ceil(articleNum/8);
        res.render("index", {articles: articles, user: req.session.user,pageNum:pageNum,page:page});
    })
});

// 登录页
router.get('/login', function (req, res, next) {
    // res.render():渲染一个视图模板，第一个参数是模板引擎文件夹下的视图文件名，第二个参数是传递给视图的json数据
    res.render('login', {message: '', user: req.session.user});
});
// 登录信息校验
router.post('/login', function (req, res, next) {
    var name = req.body.name;
    console.log(name);
    var password = req.body.password;
    // var hash = crypto.createHash('md5');
    // hash.update(password);  // 这里使用加密 在数据库查询中会报错
    // password = hash.digest('hex');
    // mysql.escape用来防止SQL注入攻击
    console.log(mysql.escape(name));
    var query = 'SELECT * FROM author WHERE authorName=' + mysql.escape(name) + ' AND authorPassword=' + mysql.escape(password);
    console.log(query);
    mysql.query(query, function (err, rows, fields) {
        if (err) {
            console.log(err);
            return;
        }
        var user = rows[0];
        console.log(rows);
        if (!user) {
            res.render('login', {message: '用户名或者密码错误'});
            return;
        }
        req.session.user = user; // 将用户信息添加到session中
        res.redirect('/'); // 自动跳转到首页
    });
});

// 动态路由获取文章的内容
router.get('/articles/:articleID', function (req, res, next) {
    var articleID = req.params.articleID; // req.params
    var query = 'SELECT * FROM article WHERE articleID=' + mysql.escape(articleID);
    mysql.query(query, function (err, rows, fields) {
        if (err) {
            console.log(err);
            return;
        }
        // 浏览量加一
        var query = 'UPDATE article SET articleClick=articleClick+1 WHERE articleID=' + mysql.escape(articleID);
        var article = rows[0];
        mysql.query(query, function (err, rows, fields) {
            if (err) {
                console.log(err)
                return;
            }
            // 时间标准化
            var year = article.articleTime.getFullYear();
            var month = article.articleTime.getMonth() + 1 > 10 ? article.articleTime.getMonth() : '0' + (article.articleTime.getMonth() + 1);
            var date = article.articleTime.getDate() > 10 ? article.articleTime.getDate() : '0' + article.articleTime.getDate();
            article.articleTime = year + '-' + month + '-' + date;
            res.render('article', {article: article, user: req.session.user});
        });
    });
});
// edit get
router.get('/edit', function (req, res, next) {
    var user = req.session.user;
    if (!user) { // 如果没有缓存 直接重定向到login页面
        res.redirect('/login');
        return;
    }
    res.render('edit', {user: req.session.user});
});
// edit post请求
router.post('/edit', function (req, res, next) {
    var title = req.body.title;
    var content = req.body.content;
    var author = req.session.user.authorName;
    var query = 'INSERT article SET articleTitle=' + mysql.escape(title) + ',articleAuthor=' + mysql.escape(author) + ',articleContent=' + mysql.escape(content) + ',articleTime=CURDATE()';
    mysql.query(query, function (err, rows, fields) {
        if (err) {
            console.log(err);
            return;
        }
        res.redirect('/');
    });
});
// 友情链接
router.get('/friends', function (req, res, next) {
    res.render('friends', {user: req.session.user});
});

// 关于博客页面
router.get('/about', function (req, res, next) {
    res.render('about', {user: req.session.user});
});
// 退出
router.get('/logout', function (req, res, next) {
    req.session.user = null; // 退出
    res.redirect('/');
});
// 修改博客
router.get('/modify/:articleID', function (req, res, next) {
    var articleID = req.params.articleID;
    var user = req.session.user;
    var query = 'SELECT * FROM article WHERE articleID=' + mysql.escape(articleID);
    if (!user) {
        res.redirect('/login');
        return;
    }
    mysql.query(query, function (err, rows, fields) {
        if (err) {
            console.log(err);
            return;
        }
        var article = rows[0];
        var title = article.articleTitle;
        var content = article.articleContent;
        res.render('modify', {user: user, title: title, content: content});
    });
});
// 操作数据库
router.post('/modify/:articleID', function (req, res, next) {
    var articleID = req.params.articleID;
    var user = req.session.user;
    var title = req.body.title;
    var content = req.body.content;
    var query = 'UPDATE article SET articleTitle=' + mysql.escape(title) + ',articleContent=' + mysql.escape(content) + 'WHERE articleID=' + mysql.escape(articleID);
    mysql.query(query, function (err, rows, fields) {
        if (err) {
            console.log(err);
            return;
        }
        res.redirect('/');
    });
});
// 删除文章
router.get('/delete/:articleID', function (req, res, next) {
    var articleID = req.params.articleID;
    var user = req.session.user;
    var query = 'DELETE FROM article WHERE articleID=' + mysql.escape(articleID);
    if (!user) {
        res.redirect('/login');
        return;
    }
    mysql.query(query, function (err, rows, fields) {
        res.redirect('/')
    });
});
module.exports = router;
