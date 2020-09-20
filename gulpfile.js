import gulp from "gulp";
import handlebars from "gulp-compile-handlebars";
import rename from "gulp-rename";
import filelist from "gulp-filelist";
import fs from "fs";
import connect from "gulp-connect";
import plumber from "gulp-plumber";
import concat from "gulp-concat";
import clean from "gulp-clean-css";
import uglify from "gulp-uglify";
import autoprefixer from "gulp-autoprefixer";

gulp.task("connect", () => {
  connect.server({
    port: 8888,
  });
});

const vendorStyles = ["node_modules/bootstrap/dist/css/bootstrap.min.css"];

const vendorsScripts = [
  "node_modules/jquery/dist/jquery.js",
  "node_modules/popper.js/dist/umd/popper.min.js",
  "node_modules/bootstrap/dist/js/bootstrap.min.js",
];

gulp.task("styles-combine", () => {
  gulp
    .src(vendorStyles)
    .pipe(plumber())
    .pipe(concat("vendors.min.css"))
    .pipe(clean())
    .pipe(gulp.dest("assets/css"));
});

gulp.task("scripts-combine", () => {
  gulp
    .src(vendorScripts)
    .pipe(plumber())
    .pipe(concat("vendors.min.js"))
    .pipe(uglify())
    .pipe(gulp.dest("assets/js"));
});

gulp.task("styles", () => {
  gulp
    .src("src/sass/styles.scss")
    .pipe(plumber())
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(gulp.dest("assets/css"))
    .pipe(sass({ outputStyle: "compressed" }))
    .pipe(rename("styles.min.css"))
    .pipe(gulp.dest("assets/css"));
});

gulp.task("scripts", () => {
  gulp
    .src("src/js/scripts.js")
    .pipe(plumber())
    .pipe(gulp.dest("assets/js"))
    .pipe(uglify())
    .pipe(rename("scripts.min.js"))
    .pipe(gulp.dest("assets/js"));
});

gulp.task("scripts-page", () => {
  gulp
    .src("src/js-page/*.js")
    .pipe(plumber())
    .pipe(gulp.dest("assets/js"))
    .pipe(uglify())
    .pipe(gulp.dest("assets/js"));
});

gulp.task("html", () => {
  gulp.src("*.html").pipe(plumber());
});

gulp.task("createFileIndex", () => {
  gulp
    .src(["./src/*.*"])
    .pipe(filelist("filelist.json", { flatten: true, removeExtensions: true }))
    .pipe(gulp.dest("./"));
});

gulp.task("watch", () => {
  gulp.watch("src/*.hbs", { cwd: "./" }, ["createFileIndex"]);
  gulp.watch("src/**/*.hbs", { cwd: "./" }, ["compile"]);
  gulp.watch("filelist.json", { cwd: "./" }, ["compile"]);
  gulp.watch(["*.html"], ["html"]);
  gulp.watch(["src/sass/**/*.scss"], ["styles"]);
  gulp.watch(["src/js-page/*.js"], ["scripts-page"]);
  gulp.watch(["src/js/scripts.js"], ["scripts"]);
  gulp.watch(["src/pug/**/*.pug"], ["views"]);
});

gulp.task("compile", () => {
  const templateList = JSON.parse(fs.readFileSync("./filelist.json", "utf8"));
  const templateData = {
      title: "MRO Finder",
      desc:
        "We Match AIRCRAFT OPERATORS With MRO and Other AIRCRAFT Service Providers",
      templates: templateList,
    },
    options = {
      ignorePartials: true, //ignores the unknown footer2 partial in the handlebars template, defaults to false
      batch: ["./src/partials"],
      helpers: {
        capitals: function (str) {
          str.toUpperCase();
        },
      },
    };
  const doAllTemplates = function () {
    for (const i = 0; i < templateList.length; i++) {
      compileTemplate(templateList[i]);
    }
  };
  const compileTemplate = function (templateName) {
    gulp
      .src("src/" + templateName + ".hbs")
      .pipe(handlebars(templateData, options))
      .pipe(rename(templateName + ".html"))
      .pipe(gulp.dest(""));
  };
  doAllTemplates();
});
gulp.task("combine", gulp.series("styles-combine", "scripts-combine"));

gulp.task(
  "default",
  gulp.series(
    "connect",
    "styles",
    "scripts-page",
    "scripts",
    "html",
    "compile",
    "watch"
  )
);
