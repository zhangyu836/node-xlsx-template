'use strict';

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-terser');
  //grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-exorcise');

  grunt.initConfig({
    babel: {
      options: {
        sourceMap: true,
        compact: false,
        presets: ['@babel/preset-env'],
      },
      dist: {
        files: [
          {
            expand: true,
            src: ['./tmp/**/*.js'],
            dest: './build/',
          },
        ],
      },
    },
    browserify: {
      options: {
        transform: [
          ['babelify', {
            // enable babel transpile for node_modules
            global: true,
            presets: ['@babel/preset-env'],
            // core-js should not be transpiled
            // See https://github.com/zloirock/core-js/issues/514
            ignore: [/node_modules[\\/]core-js/],
          }],
        ],
        browserifyOptions: {
          // enable source map for browserify
          debug: true,
          standalone: 'BookWriter',
        },
      },
      bare: {
        // keep the original source for source maps
        src: ['./tmp/exceljs/bookwriter.js'],
        dest: './dist/xltpl.bare.js',
      },
      bundle: {
        // keep the original source for source maps
        src: ['./tmp/exceljs/xltpl.browser.js'],
        dest: './dist/xltpl.js',
      },
      luckysheet: {
        // keep the original source for source maps
        src: ['./tmp/luckysheet/bookwriter.js'],
        dest: './dist/xltpl.ls.js',
      }
    },

    terser: {
      options: {
        output: {
          preamble: '/*! Xltpl <%= grunt.template.today("dd-mm-yyyy") %> */\n',
          ascii_only: true,
        },
      },
      dist: {
        options: {
          // Keep the original source maps from browserify
          // See also https://www.npmjs.com/package/terser#source-map-options
          sourceMap: {
            content: 'inline',
            url: 'xltpl.min.js.map',
          },
        },
        files: {
          './dist/xltpl.min.js': ['./dist/xltpl.js'],
        },
      },
      bare: {
        options: {
          // Keep the original source maps from browserify
          // See also https://www.npmjs.com/package/terser#source-map-options
          sourceMap: {
            content: 'inline',
            url: 'xltpl.bare.min.js.map',
          },
        },
        files: {
          './dist/xltpl.bare.min.js': ['./dist/xltpl.bare.js'],
        },
      },
      luckysheet: {
        options: {
          // Keep the original source maps from browserify
          // See also https://www.npmjs.com/package/terser#source-map-options
          sourceMap: {
            content: 'inline',
            url: 'xltpl.ls.min.js.map',
          },
        },
        files: {
          './dist/xltpl.ls.min.js': ['./dist/xltpl.ls.js'],
        },
      },
    },

    // Move source maps to a separate file
    exorcise: {
      bundle: {
        options: {},
        files: {
          './dist/xltpl.js.map': ['./dist/xltpl.js'],
          './dist/xltpl.bare.js.map': ['./dist/xltpl.bare.js'],
        },
      },
      luckysheet: {
        options: {},
        files: {
          './dist/xltpl.ls.js.map': ['./dist/xltpl.ls.js'],
        },
      },
    },

    copy: {
      lib: {
        files: [
          {expand: true, src: ['**'], cwd: './lib', dest: './tmp'},
        ],
      },
      browser: {
        files: [
          {expand: true, src: ['**'], cwd: './browser/exceljs', dest: './tmp/exceljs'},
        ],
      },
      dist: {
        files: [
          {expand: true, src: ['**'], cwd: './build/tmp', dest: './dist/es5'},
          {src: './LICENSE', dest: './dist/LICENSE'},
        ],
      },
    },

    clean: {
      tmp: {
        src: ['tmp'],
      },
      build: {
        src: ['build'],
      },
      dist: {
        src: ['dist'],
      },
    },
  });

  //grunt.registerTask('build', ['babel:dist', 'browserify', 'terser', 'exorcise', 'copy']);
  grunt.registerTask('build', ['clean', 'copy:lib', 'copy:browser', 'babel:dist',
    'browserify', 'terser', 'exorcise', 'copy:dist', 'clean:tmp', 'clean:build']);
  grunt.registerTask('ug', ['terser']);
};
