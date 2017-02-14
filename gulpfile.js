var gulp        = require('gulp');
var del          = require('del');

var stylus      = require('gulp-stylus');
/*var postcss      = require('gulp-postcss');*/
var path         = require('path');
var argv         = require('yargs').argv;
var gulpif       = require('gulp-if');
var uglify       = require('gulp-uglify');
var plumber      = require('gulp-plumber');
var notify       = require('gulp-notify');
var rev          = require('gulp-rev');
var gulpSequence = require('gulp-sequence');
var gutil        = require('gulp-util');
var browserSync  = require('browser-sync').create();
var globby       = require('globby'); // 匹配文件
var source       = require('vinyl-source-stream');
var merge2       = require('merge2');
var buffer       = require('vinyl-buffer');
var throttle     = require('throttle-debounce/throttle');

var browserify   = require('browserify');  //编译工具 构建模块化应用

var DEV = true;  //是否测试环境
var dst = 'dist';   //最终打包到的资源文件夹

/**
 * argv.d ==> 命令中包含 -d 选项
 * argv._[0] ==> 任务名
 */
if( argv.d || argv._[0] == 'deploy' ){
  if(argv._[0] == 'deploy'){
    DEV = false;
  }else{
    DEV = true;
  }
  
  dst = 'src/static';
}

var srcStylus = 'styles/stylus/*.styl',
    srcWatchStylus = 'styles/stylus/**/*.styl',
    srcJs = 'js/*.js',
    srcWatchJs = 'js/**/*.js',
    dstJs = dst + '/js',
    srcPages = 'pages/*.html',
    srcImage = 'img/**/*.*',
    dstImage = dst + '/img',
    srcWatchHtml = 'pages/**/*.html',
    dstHtml = path.resolve( dst , '../templates'),
    srclib =  'js/lib/*.js',
    srcPlugins = dst + '/plugins/*.js',
    dstCss    = dst + '/css/',
    srcRev  = 'rev/*.json',
    dstRev = 'rev';


//rev, 测试环境下，不生成版本号文件，阻止版本号生效
var ifRev = function(){
  return gulpif(!DEV, rev.apply(null, Array.prototype.slice.call(arguments)))
};

var onError = function (err) {
  notify.onError({
    title: "编译出错",
    // message: err.message.replace(/.+\/(.+\.(jsx|js).+)/g, '$1'),
    message: err.message,
    sound: "Beep"
  })(err);
};

gulp.task('clean', function(){
  return del(['dist', 'templates']);
});

//STYLUS文件输出CSS,天生自带压缩特效;
//命令行使用gulp stylus启用此任务;
// css->url->gulp-css-url-adjuster (未来会用到)
gulp.task('stylus', function() {
  return (
    gulp.src(srcStylus)
      .pipe(plumber({errorHandler: onError}))
      .pipe(stylus({compress: !DEV}))
      /*.pipe(rucksack({fallbacks: true})) //一系列postcss处理*/
/*      .pipe(postcss([
        require('postcss-triangle'), //三角形
        require('autoprefixer')({ browsers: ['last 2 versions', '> 1%', 'ie 8-11'] }),
        require('postcss-csso')({restructure: false}) //css去重，压缩
       ]))*/
      .pipe(rev.manifest('stylus.json'))
      .pipe(gulp.dest(dstCss))
  )
});

gulp.task('lib-script', function(){
  return (
    gulp.src(srclib)
      .pipe(uglify())
      .pipe(gulp.dest(path.join(dst, 'lib')))
    )
});

gulp.task('script', function(){
  var stream = merge2();
  globby([srcJs]).then(function(entries){
    //遍历文件
    entries.forEach(function(file){
      var filename = file.substr(file.lastIndexOf('/') + 1); // 取出文件名
      stream.add(
        browserify(file)
          .bundle()
          .on('error', function(err){
            gutil.log(gutil.colors.red(err));
            this.emit('end');
          })
          .pipe(source(filename))
          .pipe(buffer())
        )
    })
  }).catch(gutil.log);

  return stream
    .pipe(gulp.dest(dstJs))
/*  return (
    gulp.src(srcExampleJs)
      .pipe(browserify())
      .pipe(gulp.dest(dstExampleJs))
    )*/
});

gulp.task('imgmin', function(){
  return (
    gulp.src(srcImage)
      .pipe(gulp.dest(dstImage))
    )
})

gulp.task('html', function(){
  return (
    gulp.src(srcPages)
      .pipe(gulp.dest(dstHtml))
  )
});

//服务器任务:以当前文件夹为基础,启动服务器;
//命令行使用gulp server启用此任务;
gulp.task('server', function() {
  browserSync.init({
    server: ['dist', 'pages/'],
    port: 8021,
    ui: {port: 8022},
    open: false,
    reloadOnRestart: true,
  });
});

//监控改动并自动刷新任务;
//命令行使用gulp watch启动;
gulp.task('watch', function() {
  gulp.watch(srcWatchStylus, ['stylus']);
  gulp.watch(srcWatchJs, ['script']);
  gulp.watch(srcWatchHtml, ['html']);
  gulp.watch('js/lib/**/*', ['lib-script']);
  //gulp.watch(srcRev, ['rev:html', 'rev:img']);
  gulp.watch(['dist/pages/*.html', '/dist/js/*.js']).on('change', throttle(800, function(){
    setTimeout(browserSync.reload, 0);
  }));

  gutil.log(gutil.colors.green('-----------------------------'));
  gutil.log(gutil.colors.green('   自动监测编译功能已启用...'));
  gutil.log(gutil.colors.green('-----------------------------'));
});

gulp.task('default', gulpSequence(
  'clean', 'stylus', 'imgmin' , 'lib-script', 'script','html', ['server','watch']
  ))

//发布production版
gulp.task('deploy', gulpSequence(
  ['script', 'lib-script', 'stylus'], 'html'
));






