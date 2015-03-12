/*jshint node: true */

module.exports = function (grunt) {
    "use strict";

    require("load-grunt-tasks")(grunt);

    var pkg = grunt.file.readJSON("package.json");

    grunt.initConfig({
        pkg: pkg,
        jshint: {
            all: [ "**/*.js", "!node_modules/**" ]
        },
        bump: {
            tag: false
        },
        compress: {
            dist: {
                options: {
                    archive: "dist/<%= pkg.name %>.v<%= pkg.version %>.zip"
                },
                expand: true,
                src: [ "**/*", "!Gruntfile.js", "!node_modules/**", "!.*", "!dist" ]
            }
        }
    });

    grunt.registerTask("build", [ "jshint", "compress" ]);

};