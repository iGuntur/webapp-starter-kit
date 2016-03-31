'use strict';

var fs = require('fs')
, path = require('path')
, gulp = require('gulp')
, $ = require('gulp-load-plugins')()
, marked = require('jstransformer-marked')
, browserSync = require('browser-sync')
, transformer = require('jstransformer');


// Queen Header from package.json 
var pkg    = require('./package.json');
var banner = [
  '/*!',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * ',
  ' * @link    : <%= pkg.homepage %>',
  ' * @author  : <%= pkg.author.name %> | (<%= pkg.author.url %>)',
  ' **/',
  ' ',
  ''].join('\n');

var siteServer = {
    host : 'http://0.0.0.0',
    port : 5000
};

// App Path
var app  = {
    filename: 'myapp',

    views: {
        src: './app',
        dest: './_site'
    },

    js: {
        src: './app/assets/js', 
        dest: './_site/assets/js'
    },

    css: {
        src: './app/assets/css',
        dest: './_site/assets/css'
    },

    img: {
        src: './app/assets/img',
        dest: './_site/assets/img'
    }
};




/**
 * @app | Queen JS Task
 * ------------------------------------------------------------------------ */
gulp.task('js', function() {
// Uncompressed | concating file
    gulp.src(app.js.src + '/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.plumber({errorHandler: $.notify.onError("Error :: <%= error.message %>")}))
        .pipe($.concat(app.filename + '.js')) // <- Concating
        .pipe($.header(banner, { pkg : pkg } ))
        .pipe($.sourcemaps.write('.', { includeContent: false }))
        .pipe(gulp.dest(app.js.dest));

// Compressed | concating file
    return gulp.src(app.js.src)
        .pipe($.sourcemaps.init())
        .pipe($.plumber({errorHandler: $.notify.onError("Error :: <%= error.message %>")}))
        .pipe($.uglify()) // <- Compressed
        .pipe($.concat(app.filename + '.min.js')) // <- Concating
        .pipe($.header(banner, { pkg : pkg } ))
        .pipe($.sourcemaps.write('.', { includeContent: false }))
        .pipe(gulp.dest(app.js.dest));
});

/**
 * @app | Queen SASS Task
 * ------------------------------------------------------------------------ */
gulp.task('sass', function() {
// App Quenn | Uncompressed
    gulp.src(app.css.src + '/**/*.scss')
        .pipe($.scssLint({'config': '.scsslintrc'}))
        .pipe($.sourcemaps.init())
        .pipe($.plumber({errorHandler: $.notify.onError("Error :: <%= error.message %>")}))
        .pipe($.sass({
            outputStyle: 'expanded',
            includePaths: []
        }))
        .pipe($.autoprefixer({ browsers: ['last 15 versions'], cascade: true }))
        .pipe($.stripCssComments({preserve: true}))
        .pipe($.concat(app.filename + '.css'))
        .pipe($.removeEmptyLines())
        .pipe($.header('@charset "UTF-8";\n' + banner, { pkg : pkg } ))
        .pipe($.sourcemaps.write('.', { includeContent: false }))
        .pipe(gulp.dest(app.css.dest));

// App Quenn | Compressed (minify)
    return gulp.src(app.sass.src)
        .pipe($.scssLint({'config': '.scsslintrc'}))
        .pipe($.sourcemaps.init())
        .pipe($.plumber({errorHandler: $.notify.onError("Error :: <%= error.message %>")}))
        .pipe($.sass({
            outputStyle: 'expanded',
            includePaths: []
        }))
        .pipe($.autoprefixer({ browsers: ['last 15 versions'], cascade: true }))
        .pipe($.stripCssComments({preserve: true}))
        .pipe($.concat(app.filename + '.min.css'))
        .pipe($.removeEmptyLines())
        .pipe($.header('@charset "UTF-8";\n' + banner, { pkg : pkg } ))
        .pipe($.sourcemaps.write('.', { includeContent: false }))
        .pipe(gulp.dest(app.sass.dest));
});

/**
 * @img
 * ------------------------------------------------------------------------ */
gulp.task('img', function() {   
    return gulp.src(app.img.src + '/**')
        .pipe(gulp.dest(app.img.dest));
});


/**
 * @view | docs | site
 * Jade Task - HTML
 * ------------------------------------------------------------------------ */
gulp.task('views', function() {
    return gulp.src([app.views.src +'/**/*.jade', '!'+ app.views.src +'/_*/**/*.jade'])
        .pipe($.jade({ pretty: true }))
        .pipe($.data(function () {
            return { baseUrl: siteServer.host + ':' + siteServer.port, appName: app.filename };
        }))
        .pipe($.template())
        .pipe(gulp.dest(app.views.dest));
});


/**
 * @jsHint
 * ------------------------------------------------------------------------ */
gulp.task('lint:js', function() {
    return gulp.src(app.js.dest + '/**/*.js')
        .pipe($.jshint())
        .pipe($.jshint.reporter('default'));
});


/**
 * @lint | CSS Linter
 * ------------------------------------------------------------------------ */
var lintCssReporter = function(file) {
    $.util.log($.util.colors.cyan(file.csslint.errorCount)+' errors in '+$.util.colors.magenta(file.path));
    file.csslint.results.forEach(function(result) {
        $.util.log(result.error.message+' on line '+result.error.line);
    });
};

gulp.task('lint:css', function() {
    return gulp.src([app.css.dest + '/**/*.css'])
        .pipe($.csslint('.csslintrc'))
        .pipe($.csslint.reporter(lintCssReporter));
});

/**
 * @lint html
 * ------------------------------------------------------------------------ */
gulp.task('lint:html', function() {
    return gulp.src(app.html.dest + '/**/*.html')
        .pipe($.htmlhint('.htmlhintrc'))
        .pipe($.htmlhint.reporter());
});


/**
 * @rmDir
 * ------------------------------------------------------------------------ */
gulp.task('rmDir', function() {
    return gulp.src([
              '.sass-cache'
            , '.tmp'
            , './_gh*'
            , './site/*'
        ], {read: false})
        .pipe($.clean({force: true}));
});

// /**
//  * @copy 
//  * ------------------------------------------------------------------------ */
// gulp.task('copy', function() {
//     // 1. copy from app dist -> docs assets
//     gulp.src(app.dist+'/**').pipe(gulp.dest(docs.assets));
// });

/**
 * @serve ['development']
 * ------------------------------------------------------------------------ */
gulp.task('serve', $.sequence(
      'rmDir'
    , 'js'
    , 'sass', 'lint:css'
    , 'views', 'lint:html'
    , 'sync'
    , 'watch'
));

/**
 * @release ['production']
 * ------------------------------------------------------------------------ */
gulp.task('production', $.sequence(
      'rmDir'
    , 'js'
    , 'sass', 'lint:css'
    , 'views', 'lint:html'
));


/**
 * @watch
 * Watching Task
 * ------------------------------------------------------------------------ */
gulp.task('watch', function() {
    gulp.watch([app.js.src     + '/**/*.js'],   ['js']);    // watch and build js
    gulp.watch([app.sass.src   + '/**/*.scss'], ['sass']);  // watch and build sass
    gulp.watch([app.views.src  + '/**/*.jade'], ['views']); // watch and build views
    gulp.watch([app.views.dest + '/**/*']).on('change', function() { browserSync.reload(); }); // reloadBrowser
});


/**
 * @browserSync | Connect Server
 * ------------------------------------------------------------------------ */
gulp.task('sync', function() {
    browserSync({
        port   : siteServer.port,
        server : app.views.dest,
        reloadOnRestart: true,
        open: false,
        online: false,
        notify: false
    });
});

/**
 * @ Default Task
 * ------------------------------------------------------------------------ */
gulp.task('default', ['serve']);
