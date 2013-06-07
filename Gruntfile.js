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
          timeout: 5000
        },
        src: ['test/*.js']
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