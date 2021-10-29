/**
 * @description: gulp setup
 * @author: John Chiang <john@juhui.pro>
 * @date: 2020-09-01 17:30:40
 */
'use strict'

const { src, dest, series, parallel } = require('gulp')
const uglify = require('gulp-uglify')
const babel = require('gulp-babel')
const concat = require('gulp-concat')
const less = require('gulp-less')
const del = require('del')
const minifycss = require('gulp-clean-css')
const autoprefixer = require('gulp-autoprefixer')
const rename = require('gulp-rename')
const htmltpl = require('gulp-html-tpl')
const artTemplate = require('art-template')
const rev = require('gulp-rev-dxb')
const revCollector = require('gulp-rev-collector-dxb')
const changed = require('gulp-changed')
const gulpif = require('gulp-if')
// gulp-watch fixed some bug
const watch = require('gulp-watch')
const browserSync = require('browser-sync').create()
const reload = browserSync.reload
const fs = require('fs')
const zip = require('gulp-zip')

const options = {
  env: process.argv[2] || 'build',
  paths: {
    html: 'src/{pages,components}/**/*.html',
    pages: 'src/pages/**/*.html',
    js: 'src/{components,api,utils}/**/*.js',
    js_pages: 'src/pages/**/*.js',
    js_lib: 'src/assets/js/*.js',
    css: 'src/{pages,components}/**/*.{css,less}',
    css_lib: 'src/assets/css/*.{css,less}',
    font_lib: 'src/assets/font/**',
    img: 'src/assets/imgs/**',
  },
}

function html() {
  return src(options.paths.pages)
    .pipe(changed('./dist'))
    .pipe(
      htmltpl({
        tag: 'components',
        paths: ['src/components'],
        dataTag: 'data',
        data: {
          // init
          header: false,
          name: 'index',
        },
        engine: function (components, data) {
          return components && artTemplate.compile(components)(data)
        },
      })
    )
    .pipe(
      rename({
        dirname: '',
      })
    )
    .pipe(dest('./dist/'))
}

function css() {
  return (
    src([options.paths.css_lib, options.paths.css])
      .pipe(less())
      .on('error', function (err) {
        // skip block
        console.log('\x1B[31m%s\x1B[0m', '\nLess Error: ' + err.message + '\n')
        this.end()
      })
      .pipe(autoprefixer())
      .pipe(concat('main.css'))
      .pipe(dest('./dist/css'))
      .pipe(minifycss())
      .pipe(rename({ dirname: '', extname: '.min.css' }))
      .pipe(dest('./dist/css'))
  )
}

// function css_lib() {
//   return src(options.paths.css_lib)
//     .pipe(changed('./dist/css'))
//     .pipe(dest('./dist/css'))
//     .pipe(minifycss())
//     .pipe(rename({ extname: '.min.css' }))
//     .pipe(dest('./dist/css'))
// }

function js() {
  return src(options.paths.js)
    .pipe(babel())
    .pipe(concat('main.js'))
    .pipe(dest('./dist/js'))
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(dest('./dist/js'))
}

function js_pages() {
  return src(options.paths.js_pages)
    .pipe(babel())
    .pipe(
      rename({
        dirname: '',
      })
    )
    .pipe(dest('./dist/js'))
}

function js_lib() {
  return src(options.paths.js_lib)
    .pipe(changed('./dist/js'))
    .pipe(babel())
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    // .pipe(gulpif(options.env === 'build', uglify()))
    // .pipe(gulpif(options.env === 'build', rename({ suffix: '.min' })))
    .pipe(dest('./dist/js'))
}

function img() {
  return src(options.paths.img).pipe(changed('./dist/imgs')).pipe(dest('./dist/imgs'))
}

function font() {
  return src(options.paths.font_lib).pipe(changed('./dist/font')).pipe(dest('./dist/font'))
}

function create_ver() {
  return src(['./dist/**/*', '!./dist/**/*.html', '!./dist/**/*.txt']).pipe(rev()).pipe(rev.manifest()).pipe(dest('./'))
}

function set_ver() {
  return src(['./rev-manifest.json', './dist/**/*.html'], { allowEmpty: true })
    .pipe(revCollector())
    .pipe(dest('./dist'))
}

function write_ver(cb) {
  const obj = {
    Build_Version: '0.1.0',
    Build_Date: Date(),
  }
  fs.readFile('./dist/version.txt', { flag: 'r+', encoding: 'utf8' }, function (err, data) {
    if (err) {
      console.log('Read version.text error!', err)
    }
    const abb = (data && JSON.parse(data)) || obj
    const version = +abb.Build_Version.split('.')[1]
    abb.Build_Version = '0.' + (version + 1) + '.0'
    abb.Build_Date = Date()
    fs.writeFile('dist/version.txt', JSON.stringify(abb, null, 2), function (err) {
      err && console.log(err)
    })
  })
  cb()
}

function browser(cb) {
  browserSync.init({
    server: './dist', // read dir
    // proxy: "some IP"
  })
  cb()
}

function _clean() {
  return del(['./dist/**/*', '!./dist/version.txt'])
}

function _watch(cb) {
  function w(path, task) {
    watch(path, series(task, reload))
  }
  w(options.paths.html, html)
  w(options.paths.js, js)
  w(options.paths.js_pages, js_pages)
  w(options.paths.css, css)
  w(options.paths.css_lib, css)
  w(options.paths.img, img)
  w(options.paths.font_lib, font)
  cb()
}

function _zip(cb) {
  // Read & write version file has bug
  // let obj;
  // fs.readFile('./dist/version.txt', { flag: 'r+', encoding: 'utf8' }, function (err, data) {
  //   if (err) {
  //     console.log('Read version.text error!', err)
  //   }
  //   obj = data && JSON.parse(data)
  //   const version = +obj.Build_Version.split('.')[1]
  //   obj.Build_Version = '0.' + (version + 1) + '.0'
  //   src('./dist/**').pipe(zip('dist.'+ obj.Build_Version +'.zip')).pipe(dest('./'))
  // })
  const now = Math.floor((new Date()).getTime() / 1000);
  src('./dist/**').pipe(zip('dist.'+ now +'.zip')).pipe(dest('./'));
  cb()
}

exports.dev = series(
  _clean,
  parallel(html, css, js, js_pages, js_lib, img, font),
  create_ver,
  set_ver,
  browser,
  _watch
)
exports.build = series(
  _clean,
  parallel(html, css, js, js_pages, js_lib, img, font),
  create_ver,
  set_ver,
  // write_ver,
  _zip
)
