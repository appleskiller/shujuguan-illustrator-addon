var gulp = require("gulp");

var cepDevDir = {
    "win32": "C:/Users/Administrator/AppData/Roaming/Adobe/CEP/extensions",
    "darwin": "/Users/jiang/Library/Application Support/Adobe/CEP/extensions"
}
var cepDest = cepDevDir[process.platform];
if (!cepDest) {
    throw new Error(`Unsupport platform ${process.platform}. win32 or darwin is supported.`)
}

var config = {
	name: "AIAddon",
	src: "app",
	dest: cepDest
}

var destDir = `${config.dest}/${config.name}`;

gulp.task("deploy" , () => {
	return gulp.src([`${config.src}/**/*`, `${config.src}/.debug`])
		.pipe(gulp.dest(destDir));
});