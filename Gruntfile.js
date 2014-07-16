
module.exports = function (grunt) {
    'use strict';

    // load extern tasks
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-typescript');

    // tasks
	grunt.initConfig({
        typescript: {
			build: {
				src: [
                    'src/CommandLineParser.ts',
                    'src/JsonFile.ts',
					'src/Pake.ts'
				],
				dest: 'lib/pake.js'
			}
		},
        
        uglify: {
            build: {
                files: [{
                    'lib/pake.min.js': 'lib/pake.js'
                }]
            }
        }
    });

    // register tasks
    grunt.registerTask('default', ['build']);
    grunt.registerTask('build', ['typescript', 'uglify']);
}

