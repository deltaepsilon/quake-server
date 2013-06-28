module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-nodemon');

  grunt.initConfig({
    mochaTest: {
      test: {
        options: {
          ui: 'tdd',
          timeout: 10000
        },
        src: ['test/test.js']
      },
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
          timeout: 15000
        },
        src: ['test/stripe.js']
      }
    },
    shell: {
      debug: {
        command: 'node-inspector'
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
}