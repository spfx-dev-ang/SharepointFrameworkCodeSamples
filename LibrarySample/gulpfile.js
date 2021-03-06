const gulp = require('gulp');
const build = require('@microsoft/sp-build-web');
var through = require('through2'),
    util = require('gulp-util'),
    spawn = require('child_process').spawn,
    clean = require('gulp-clean'),
    ts = require('gulp-typescript');

build.initialize(gulp);

var libsPath = 'lib/libraries';
var srcPath = 'src/libraries';
var calculatorLibraryFolder = 'calculator';

gulp.task('watch-calculator-lib', (cb) => {
  var watcher = gulp.watch(`${srcPath}/${calculatorLibraryFolder}/**/*.ts`, ['update-calculator-typings']);
  watcher.on('change', (event) => {
    console.log(`File ${event.path} was ${event.type}, Rebuilding library typings...`);
  });
});

gulp.task('update-calculator-typings', [
  'update-calculator-typings:clean-old-typings',
  'update-calculator-typings:get-latest-typings',
  'update-calculator-typings:build-lib-typings'
], () => {
});

gulp.task('update-calculator-typings:clean-old-typings', () => {
  return gulp.src(`${libsPath}/${calculatorLibraryFolder}/**`, { read: false })
    .pipe(clean());
});

gulp.task('update-calculator-typings:get-latest-typings', ['update-calculator-typings:clean-old-typings'], () => {
  var tsResult = gulp.src(`${srcPath}/${calculatorLibraryFolder}/**/*.ts`)
    .pipe(ts({
      outDir: `${libsPath}/${calculatorLibraryFolder}`,
      module: 'umd',
      declaration: true
    }));
  return tsResult.dts.pipe(gulp.dest(`${libsPath}/${calculatorLibraryFolder}`));
});

gulp.task('update-calculator-typings:build-lib-typings', ['update-calculator-typings:get-latest-typings'], () => {
  return gulp.src(`${libsPath}/${calculatorLibraryFolder}/**/*.d.ts`)
    .pipe(updateLibTypings('calculator.d.ts'))
    .pipe(gulp.dest('./typings'));
});

var updateLibTypings = function (typingsFilePath, opt) {
  var typings = ["declare module 'calculator' {"];
  var latestFile;

  function processTypings(file, encoding, cb) {
    if (file.isNull() || file.isStream()) {
      cb();
      return;
    }

    latestFile = file;

    var contents = file.contents.toString('utf8');
    if (contents.indexOf('export declare class ') === -1) {
      cb();
      return;
    }

    contents = contents.replace('export declare class ', 'class ');
    typings.push(contents);
    cb();
  }

  function endStream(cb) {
    if (!latestFile) {
      cb();
      return;
    }

    typings.push('}');

    var file = latestFile.clone({ contents: false });
    file.path = latestFile.base + typingsFilePath;
    file.contents = new Buffer(typings.join('\r\n'));
    this.push(file)
    cb();
  }

  return through.obj(processTypings, endStream);
}