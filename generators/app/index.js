'use strict';
var generators = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');
var wiredep = require('wiredep');
var mkdirp = require('mkdirp');
var _s = require('underscore.string');
var path = require('path');
var dest;

module.exports = generators.Base.extend({
    constructor: function () {
        var testLocal;
        //this.destinationRoot(this.destinationRoot() + 'skin/');

        generators.Base.apply(this, arguments);

        this.option('skip-welcome-message', {
            desc: 'Skips the welcome message',
            type: Boolean
        });

        this.option('skip-install-message', {
            desc: 'Skips the message after the installation of dependencies',
            type: Boolean
        });

        this.option('test-framework', {
            desc: 'Test framework to be invoked',
            type: String,
            defaults: 'mocha'
        });

        this.option('babel', {
            desc: 'Use Babel',
            type: Boolean,
            defaults: true
        });

        this.option('no-sass', {
            desc: 'Don\'t use SASS',
            type: Boolean,
            defaults: false
        });

        this.option('no-twig', {
            desc: 'Don\'t use Twig',
            type: Boolean,
            defaults: false
        });

        this.option('no-bootstrap', {
            desc: 'Don\'t use Bootstrap',
            type: Boolean,
            defaults: false
        });

        this.option('no-modernizr', {
            desc: 'Don\'t use Modernizr',
            type: Boolean,
            defaults: false
        });

        this.option('no-jquery', {
            desc: 'Don\'t use jQuery',
            type: Boolean,
            defaults: false
        });

        this.option('bootstrap-3', {
            desc: 'Use bootstrap v3 instead of v4',
            type: Boolean,
            defaults: false
        });

        if (this.options['test-framework'] === 'mocha') {
            testLocal = require.resolve('generator-mocha/generators/app/index.js');
        } else if (this.options['test-framework'] === 'jasmine') {
            testLocal = require.resolve('generator-jasmine/generators/app/index.js');
        }

        this.composeWith(this.options['test-framework'] + ':app', {
            options: {
                'skip-install': this.options['skip-install']
            }
        }, {
            local: testLocal
        });

        this.includeSass = !this.options['no-sass'];
        this.includeBootstrap = !this.options['no-bootstrap'];
        this.includeModernizr = !this.options['no-modernizr'];
        this.legacyBootstrap = this.options['bootstrap-3'];
        this.includeJQuery = !this.options['no-jquery'];
        this.noTwig = this.options['no-twig'];
    },

    initializing: function () {
        this.pkg = require('../../package.json');
    },

    writing: {
        gulpfile: function () {
            this.fs.copyTpl(
                this.templatePath('gulpfile.js'),
                this.destinationPath('gulpfile.js'),
                {
                    date: (new Date).toISOString().split('T')[0],
                    name: this.pkg.name,
                    version: this.pkg.version,
                    includeSass: this.includeSass,
                    includeBootstrap: this.includeBootstrap,
                    legacyBootstrap: this.legacyBootstrap,
                    includeBabel: this.options['babel'],
                    testFramework: this.options['test-framework']
                }
            );
        },

        packageJSON: function () {
            this.fs.copyTpl(
                this.templatePath('_package.json'),
                this.destinationPath('package.json'),
                {
                    includeSass: this.includeSass,
                    includeBabel: this.options['babel'],
                    includeJQuery: this.includeJQuery,
                }
            );
        },

        babel: function () {
            this.fs.copy(
                this.templatePath('babelrc'),
                this.destinationPath('.babelrc')
            );
        },

        git: function () {
            this.fs.copy(
                this.templatePath('gitignore'),
                this.destinationPath('.gitignore'));

            this.fs.copy(
                this.templatePath('gitattributes'),
                this.destinationPath('.gitattributes'));
        },

        bower: function () {
            var bowerJson = {
                name: _s.slugify(this.appname),
                private: true,
                dependencies: {}
            };

            if (this.includeBootstrap) {

                // Bootstrap 4
                bowerJson.dependencies = {
                    'bootstrap': '~4.0.0-alpha.6'
                };

                // Bootstrap 3
                if (this.legacyBootstrap) {
                    if (this.includeSass) {
                        bowerJson.dependencies = {
                            'bootstrap-sass': '~3.3.5'
                        };
                        bowerJson.overrides = {
                            'bootstrap-sass': {
                                'main': [
                                    'assets/stylesheets/_bootstrap.scss',
                                    'assets/fonts/bootstrap/*',
                                    'assets/javascripts/bootstrap.js'
                                ]
                            }
                        };
                    } else {
                        bowerJson.dependencies = {
                            'bootstrap': '~3.3.5'
                        };
                        bowerJson.overrides = {
                            'bootstrap': {
                                'main': [
                                    'less/bootstrap.less',
                                    'dist/css/bootstrap.css',
                                    'dist/js/bootstrap.js',
                                    'dist/fonts/*'
                                ]
                            }
                        };
                    }
                }

            } else if (this.includeJQuery) {
                bowerJson.dependencies['jquery'] = '~3.1.1';
            }

            if (this.includeModernizr) {
                bowerJson.dependencies['modernizr'] = '~3.3.1';
            }

            this.fs.writeJSON('bower.json', bowerJson);
            this.fs.copy(
                this.templatePath('bowerrc'),
                this.destinationPath('.bowerrc')
            );
        },

        editorConfig: function () {
            this.fs.copy(
                this.templatePath('editorconfig'),
                this.destinationPath('.editorconfig')
            );
        },

        h5bp: function () {
            this.fs.copy(
                this.templatePath('favicon.ico'),
                this.destinationPath('app/favicon.ico')
            );

            this.fs.copy(
                this.templatePath('apple-touch-icon.png'),
                this.destinationPath('app/apple-touch-icon.png')
            );

            this.fs.copy(
                this.templatePath('robots.txt'),
                this.destinationPath('app/robots.txt'));
        },

        styles: function () {
            var css = 'main';

            if (this.includeSass) {
                css += '.scss';
            } else {
                css += '.css';
            }

            this.fs.copyTpl(
                this.templatePath(css),
                this.destinationPath('app/styles/' + css),
                {
                    includeBootstrap: this.includeBootstrap,
                    legacyBootstrap: this.legacyBootstrap
                }
            );
        },

        scripts: function () {
            this.fs.copy(
                this.templatePath('main.js'),
                this.destinationPath('app/scripts/main.js')
            );
        },

        html: function () {
            var bsPath, bsPlugins;

            // path prefix for Bootstrap JS files
            if (this.includeBootstrap) {

                // Bootstrap 4
                bsPath = '/bower_components/bootstrap/js/dist/';
                bsPlugins = [
                    'util',
                    'alert',
                    'button',
                    'carousel',
                    'collapse',
                    'dropdown',
                    'modal',
                    'scrollspy',
                    'tab',
                    'tooltip',
                    'popover'
                ];

                // Bootstrap 3
                if (this.legacyBootstrap) {
                    if (this.includeSass) {
                        bsPath = '/bower_components/bootstrap-sass/assets/javascripts/bootstrap/';
                    } else {
                        bsPath = '/bower_components/bootstrap/js/';
                    }
                    bsPlugins = [
                        'affix',
                        'alert',
                        'dropdown',
                        'tooltip',
                        'modal',
                        'transition',
                        'button',
                        'popover',
                        'carousel',
                        'scrollspy',
                        'collapse',
                        'tab'
                    ];
                }

            }


            if(this.noTwig){
                dest = "app/index.html";
            }
            else{
                dest = "app/base.html.twig";
            }
            this.fs.copyTpl(
                this.templatePath('index.html'),
                this.destinationPath(dest),
                {
                    appname: this.appname,
                    includeSass: this.includeSass,
                    includeBootstrap: this.includeBootstrap,
                    legacyBootstrap: this.legacyBootstrap,
                    includeModernizr: this.includeModernizr,
                    includeJQuery: this.includeJQuery,
                    bsPath: bsPath,
                    bsPlugins: bsPlugins
                }
            );
        },

        misc: function () {
            mkdirp('app/images');
            mkdirp('app/fonts');
        }
    },

    install: function () {
        this.installDependencies({
            skipMessage: this.options['skip-install-message'],
            skipInstall: this.options['skip-install']
        });
    },

    end: function () {
        var bowerJson = this.fs.readJSON(this.destinationPath('bower.json'));
        var howToInstall =
            '\nAfter running ' +
            chalk.yellow.bold('npm install & bower install') +
            ', inject your' +
            '\nfront end dependencies by running ' +
            chalk.yellow.bold('gulp wiredep') +
            '.';

        if (this.options['skip-install']) {
            this.log(howToInstall);
            return;
        }

        // wire Bower packages to .html
        wiredep({
            bowerJson: bowerJson,
            directory: 'bower_components',
            exclude: ['bootstrap-sass', 'bootstrap.js'],
            ignorePath: /^(\.\.\/)*\.\./,
            src: dest
        });

        if (this.includeSass) {
            // wire Bower packages to .scss
            wiredep({
                bowerJson: bowerJson,
                directory: 'bower_components',
                ignorePath: /^(\.\.\/)+/,
                src: 'app/styles/*.scss'
            });
        }
    }
});
