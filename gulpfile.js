var gulp        = require('gulp');

var stylus      = require('gulp-stylus');
/*var postcss      = require('gulp-postcss');*/
var plumber      = require('gulp-plumber');
var notify       = require('gulp-notify');
var gulpSequence = require('gulp-sequence');
var gutil        = require('gulp-util');
var browserSync  = require('browser-sync').create();
var globby       = require('globby'); // 匹配文件
var source       = require('vinyl-source-stream');

var browserify   = require('browserify');  //编译工具 构建模块化应用

var dst = './dist';

var srcStylus = './styles/stylus/**/*.styl',
    srcExampleJs = './examples/js/*.js',
    dstExampleJs = dst + '/examples/js/',
    srcExamplePages = './examples/pages/*.html',
    dstExamplePages = dst + '/examples/pages/',
    dstCss    = './styles/css/';


var onError = function (err) {
  notify.onError({
    title: "编译出错",
    // message: err.message.replace(/.+\/(.+\.(jsx|js).+)/g, '$1'),
    message: err.message,
    sound: "Beep"
  })(err);
};

//STYLUS文件输出CSS,天生自带压缩特效;
//命令行使用gulp stylus启用此任务;
// css->url->gulp-css-url-adjuster (未来会用到)
gulp.task('stylus', function() {
  return (
    gulp.src(srcStylus)
      .pipe(plumber({errorHandler: onError}))
      .pipe(stylus())
      /*.pipe(rucksack({fallbacks: true})) //一系列postcss处理*/
/*      .pipe(postcss([
        require('postcss-triangle'), //三角形
        require('autoprefixer')({ browsers: ['last 2 versions', '> 1%', 'ie 8-11'] }),
        require('postcss-csso')({restructure: false}) //css去重，压缩
       ]))*/
      .pipe(gulp.dest(dstCss))
  )
});

gulp.task('script', function(){
  globby([srcExampleJs]).then(function(entries){
    entries.forEach(function(file){
      var filename = file.substr(file.lastIndexOf('/') + 1); // 取出文件名
      return browserify(file)
        .buddle()
        .pipe(source(filename))
        .pipe(buffer())
        .pipe(gulp.dest(dstExampleJs))
    })
  })
/*  return (
    gulp.src(srcExampleJs)
      .pipe(browserify())
      .pipe(gulp.dest(dstExampleJs))
    )*/
})

gulp.task('html', function(){
  return (
    gulp.src(srcExamplePages)
      .pipe(gulp.dest(dstExamplePages))
  )
});

//服务器任务:以当前文件夹为基础,启动服务器;
//命令行使用gulp server启用此任务;
gulp.task('server', function() {
  browserSync.init({
    server: "/",
    port: 8021,
    ui: {port: 8022},
    open: false,
    reloadOnRestart: true,
  });
});

//监控改动并自动刷新任务;
//命令行使用gulp watch启动;
gulp.task('watch', function() {
  gulp.watch(srcStylus, ['stylus']);


  gutil.log(gutil.colors.green('-----------------------------'));
  gutil.log(gutil.colors.green('   自动监测编译功能已启用...'));
  gutil.log(gutil.colors.green('-----------------------------'));
});

gulp.task('default', gulpSequence(
  'stylus', 'script','html', ['server','watch']
  ))






