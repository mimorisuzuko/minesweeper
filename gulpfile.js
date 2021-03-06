const gulp = require('gulp');
const sass = require('gulp-sass');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const pug = require('gulp-pug');
const path = require('path');
const autoprefixer = require('gulp-autoprefixer');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const webserver = require('gulp-webserver');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const buffer = require('vinyl-buffer');

const src = 'src';
const dst = path.join('docs/');

gulp.task('sass', () => {
	gulp.src(path.join(src, '*.scss'))
		.pipe(plumber({ errorHandler: notify.onError('<%= error.message %>') }))
		.pipe(sass.sync())
		.pipe(autoprefixer())
		.pipe(gulp.dest(dst));
});

gulp.task('script', () => {
	browserify(path.join(src, 'index.js'), { debug: true })
		.transform(babelify, { presets: ['es2015'] })
		.bundle()
		.on('error', (err) => console.log(`Error : ${err.message}`))
		.pipe(source('index.js'))
		.pipe(buffer())
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(uglify())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(dst));
});

gulp.task('pug', () => {
	gulp.src(path.join(src, '*.pug'))
		.pipe(plumber({ errorHandler: notify.onError('<%= error.message %>') }))
		.pipe(pug({}))
		.pipe(gulp.dest(dst));
});

gulp.task('webserver', () => {
	gulp.src(dst)
        .pipe(webserver({
            host: 'localhost',
            port: 6280,
            livereload: false
        }));
});

gulp.task('watch', () => {
	gulp.run('webserver');
	gulp.run('sass');
	gulp.run('script');
	gulp.run('pug');
	gulp.watch(path.join(src, '*.scss'), ['sass']);
	gulp.watch(path.join(src, '*.js'), ['script']);
	gulp.watch(path.join(src, '*.pug'), ['pug']);
});

gulp.task('default', ['sass', 'script', 'pug']);