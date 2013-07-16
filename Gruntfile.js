var fs = require('fs');

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-nodemon');

  var options = {
      ui: 'tdd',
      timeout: 20000
    },
    tests = {},
    shellTests = [],
    testFiles = fs.readdirSync(__dirname + '/test'),
    i = testFiles.length,
    name;

  while (i--) {
    name = testFiles[i].match(/(\w+)\.js/);
    if (name) {
      tests[name[1]] = {options: options, src: ['test/' + name[0]]};
    }

  }

  tests.wxr.options.timeout = 60000;

  var keys = Object.keys(tests),
    j = keys.length;

  while (j--) {
    shellTests.push('grunt mochaTest:' + keys[j]);
  }

  grunt.initConfig({
    mochaTest: tests,
    shell: {
      debug: {
        command: 'node-inspector'
      },
      tests: {
        command: shellTests.join('&&'),
        options: {
          stdout: true
        }
      }
    },
    nodemon: {
      debug: {
        options: {
          file: 'app.js',
          debug: true
        }
      }
    },
    concurrent: {
      target: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    },
    watch: {
      src: {
        files: ['test/*', 'api/*', 'api/**/*', 'config/*', 'config/**/*'],
        tasks: ['mochaTest'],
        option: {
          livereload: true
        }
      }
    }
  });

  grunt.registerTask('default', ['mochaTest']);
  grunt.registerTask('test', ['shell:tests']);
}