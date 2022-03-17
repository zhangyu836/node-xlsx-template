'use strict';

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-terser');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
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
            src: ['./lib/*.js'],
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
        src: ['./lib/bookwriter.js'],
        dest: './dist/xltpl.bare.js',
      },
      bundle: {
        // keep the original source for source maps
        src: ['./lib/xltpl.browser.js'],
        dest: './dist/xltpl.js',
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
    },

    copy: {
      dist: {
        files: [
          {expand: true, src: ['**'], cwd: './build/lib', dest: './dist/es5'},
        ],
      },
    },
  });

  grunt.registerTask('build', ['babel:dist', 'browserify', 'terser', 'exorcise', 'copy']);
  grunt.registerTask('ug', ['terser']);
};
