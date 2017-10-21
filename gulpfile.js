var gulp = require("gulp");

var config = {
	name: "AIAddon",
	src: "app",
	dest: "C:/Users/Administrator/AppData/Roaming/Adobe/CEP/extensions"
}

var destDir = `${config.dest}/${config.name}`;

gulp.task("deploy" , () => {
	return gulp.src([`${config.src}/**/*`, `${config.src}/.debug`])
		.pipe(gulp.dest(destDir));
});