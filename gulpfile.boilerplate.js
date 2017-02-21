var fs = require('fs');
var path = require('path');

var gulp = require('gulp');

// Load all gulp plugins automatically
// and attach them to the `plugins` object
var plugins = require('gulp-load-plugins')();

// browser-sync does not seem to load in load-plugins function
// probably because it is not a gulp plugin
var	browserSync	=	require('browser-sync');

// Temporary solution until gulp 4
// https://github.com/gulpjs/gulp/issues/355
var runSequence = require('run-sequence');

var pkg = require('./package.json');
var dirs = pkg['h5bp-configs'].directories;

// ---------------------------------------------------------------------
// | Helper tasks                                                      |
// ---------------------------------------------------------------------

gulp.task('browserSync', function()	{
    browserSync({
        server:	{
            baseDir: 'src'
        }
    })
});


gulp.task('watch', ['browserSync', 'sass'],	function(){
    gulp.watch('src/sass/*.scss',	['sass']);
    //	Other	watchers
    //	Reloads	the	browser	when	a	JS	file	is	saved
    gulp.watch('src/scripts/**/*.js',	browserSync.reload);
});

function	errorHandler(err)	{
    //	Logs	out	error	in	the	command	line
    console.log(err.toString());
    //	Ends	the	current	pipe,	so	Gulp	watch	doesn't	break
    this.emit('end');
}

function	customPlumber(errTitle)	{
    return	plugins.plumber({
        errorHandler:	plugins.notify.onError({
            //	Customizing	error	title
            title:	errTitle	||	"Error	running	Gulp",
            message:	"Error:	<%=	error.message	%>"
        })
    });
}

// TODO: need to convert to sass-lint
gulp.task('lint:sass',	function()	{
    return	gulp.src('src/sass/*.scss')
        .pipe(plugins.sassLint({
            //	Pointing	to	config	file '.scss-lint.yml'
            configFile: '.sassLint.yml'
        }));
});


gulp.task('sass',	function()	{
    return	gulp.src('src/sass/*.scss')
    // pass custom title to gulp-plumber error handler function
        .pipe(customPlumber('Error Running	Sass'))
        //	Initialize	sourcemap
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.sass())
        //	Runs	produced	CSS	through	autoprefixer
        .pipe(plugins.autoprefixer())
        //	Writing	sourcemaps
        .pipe(plugins.sourcemaps.write())
        .pipe(gulp.dest('src/css'))
        //	Tells	Browser	Sync	to	reload	files	task	is	done
        // browserSync not loaded by load-plugins
        .pipe(browserSync.reload({
            stream:	true
        }))
});


gulp.task('archive:create_archive_dir', function () {
    fs.mkdirSync(path.resolve(dirs.archive), '0755');
});

gulp.task('archive:zip', function (done) {

    var archiveName = path.resolve(dirs.archive, pkg.name + '_v' + pkg.version + '.zip');
    var archiver = require('archiver')('zip');
    var files = require('glob').sync('**/*.*', {
        'cwd': dirs.dist,
        'dot': true // include hidden files
    });
    var output = fs.createWriteStream(archiveName);

    archiver.on('error', function (error) {
        done();
        throw error;
    });

    output.on('close', done);

    files.forEach(function (file) {

        var filePath = path.resolve(dirs.dist, file);

        // `archiver.bulk` does not maintain the file
        // permissions, so we need to add files individually
        archiver.append(fs.createReadStream(filePath), {
            'name': file,
            'mode': fs.statSync(filePath).mode
        });

    });

    archiver.pipe(output);
    archiver.finalize();

});

gulp.task('clean', function (done) {
    require('del')([
        dirs.archive,
        dirs.dist
    ]).then(function () {
        done();
    });
});

gulp.task('copy', [
    'copy:.htaccess',
    'copy:index.html',
    'copy:jquery',
    'copy:license',
    'copy:main.css',
    'copy:misc',
    'copy:normalize'
]);

gulp.task('copy:.htaccess', function () {
    return gulp.src('node_modules/apache-server-configs/dist/.htaccess')
               .pipe(plugins.replace(/# ErrorDocument/g, 'ErrorDocument'))
               .pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:index.html', function () {
    return gulp.src(dirs.src + '/index.html')
               .pipe(plugins.replace(/{{JQUERY_VERSION}}/g, pkg.devDependencies.jquery))
               .pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:jquery', function () {
    return gulp.src(['node_modules/jquery/dist/jquery.min.js'])
               .pipe(plugins.rename('jquery-' + pkg.devDependencies.jquery + '.min.js'))
               .pipe(gulp.dest(dirs.dist + '/js/vendor'));
});

gulp.task('copy:license', function () {
    return gulp.src('LICENSE.txt')
               .pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:main.css', function () {

    var banner = '/*! HTML5 Boilerplate v' + pkg.version +
                    ' | ' + pkg.license.type + ' License' +
                    ' | ' + pkg.homepage + ' */\n\n';

    return gulp.src(dirs.src + '/css/main.css')
               .pipe(plugins.header(banner))
               .pipe(plugins.autoprefixer({
                   browsers: ['last 2 versions', 'ie >= 8', '> 1%'],
                   cascade: false
               }))
               .pipe(gulp.dest(dirs.dist + '/css'));
});

gulp.task('copy:misc', function () {
    return gulp.src([

        // Copy all files
        dirs.src + '/**/*',

        // Exclude the following files
        // (other tasks will handle the copying of these files)
        '!' + dirs.src + '/css/main.css',
        '!' + dirs.src + '/index.html'

    ], {

        // Include hidden files by default
        dot: true

    }).pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:normalize', function () {
    return gulp.src('node_modules/normalize.css/normalize.css')
               .pipe(gulp.dest(dirs.dist + '/css'));
});

gulp.task('lint:js', function () {
    return gulp.src([
        'gulpfile.js',
        dirs.src + '/js/*.js',
        dirs.test + '/*.js'
    ]).pipe(plugins.jscs())
      .pipe(plugins.jshint())
      .pipe(plugins.jshint.reporter('jshint-stylish'))
      .pipe(plugins.jshint.reporter('fail'));
});


// ---------------------------------------------------------------------
// | Main tasks                                                        |
// ---------------------------------------------------------------------

gulp.task('archive', function (done) {
    runSequence(
        'build',
        'archive:create_archive_dir',
        'archive:zip',
    done);
});

gulp.task('build', function (done) {
    runSequence(
        ['clean', 'lint:js'],
        'copy',
    done);
});

gulp.task('default', ['build']);