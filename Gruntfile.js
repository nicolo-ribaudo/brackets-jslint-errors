/*jshint node: true */

module.exports = function (grunt) {
    "use strict";

    require("load-grunt-tasks")(grunt);

    var pkg = grunt.file.readJSON("package.json");

    grunt.initConfig({
        pkg: pkg,
        jshint: {
            all: [ "**/*.js", "!**/node_modules/" ]
        },
        compress: {
            dist: {
                options: {
                    archive: "<%= pkg.name %>.<%= pkg.version %>.zip"
                }
            },
            expand: true,
            src: [ "**/*", "!/node_modules/*", "!.brackets.json", "!.sass-cache" ]
        }
    });

    grunt.registerTask("build", [ "jshint", "compress" ]);

};