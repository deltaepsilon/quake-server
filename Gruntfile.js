module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-nodemon');

  var tests = {
      user: {
        options: {
          ui: 'tdd',
          timeout: 10000
        },
        src: ['test/user.js']
      },
      stripe: {
        options: {
          ui: 'tdd',
          timeout: 20000
        },
        src: ['test/stripe.js']
      },
      aws: {
        options: {
          ui: 'tdd',
          timeout: 20000
        },
        src: ['test/aws.js']
      },
      wxr: {
        options: {
          ui: 'tdd',
          timeout: 20000
        },
        src: ['test/wxr.js']
      }
    },
    keys = Object.keys(tests),
    shellTests = [],
    i = keys.length;
  while (i--) {
    shellTests.push('grunt mochaTest:' + keys[i]);
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