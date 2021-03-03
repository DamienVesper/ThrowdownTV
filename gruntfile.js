require(`dotenv`).config();

module.exports = grunt => {
    grunt.initConfig({
        pkg: grunt.file.readJSON(`package.json`),

        // Clean the served directory.
        clean: {
            dist: [`dist/*`]
        },

        // Watch for file changes.
        watch: {
            scripts: {
                files: [`**/*.js`, `!**/node_modules/**`, `**/*.json`],
                tasks: [`build-dev`],
                options: {
                    spawn: false
                }
            }
        },

        // Concurrently run watch and nodemon.
        concurrent: {
            dev: [
                `nodemon:dev`,
                `watch:scripts`
            ],
            options: {
                logConcurrentOutput: true
            }
        },

        // Use nodemon to restart the app.
        nodemon: {
            dev: {
                script: `src/server/server.js`,
                options: {
                    args: [`dev`],
                    nodeArgs: [`--inspect`]
                }
            }
        },

        copy: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: `src/client/`,
                        src: [`**`],
                        dest: `dist/`
                    }
                ]
            }
        }
    });

    // Build production (TODO).
    grunt.registerTask(`build-dist`, [
        `clean:dist`,
        `copy:dist`
    ]);

    // Build development (TODO).
    grunt.registerTask(`build-dev`, [`clean:dist`]);

    // Run development.
    grunt.registerTask(`dev`, [`concurrent:dev`]);

    // Load grunt plugins.
    grunt.loadNpmTasks(`grunt-contrib-copy`);
    grunt.loadNpmTasks(`grunt-contrib-clean`);
    grunt.loadNpmTasks(`grunt-contrib-watch`);
    grunt.loadNpmTasks(`grunt-nodemon`);
    grunt.loadNpmTasks(`grunt-concurrent`);
};
