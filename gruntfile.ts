module.exports = (grunt) => {
    grunt.initConfig({
        pkg: grunt.file.readJSON(`package.json`),

        copy: {
            client: {
                files: [
                    {
                        expand: true,
                        nonull: true,
                        cwd: `src/client`,
                        src: [`**`],
                        dest: `build/src/client`,
                        filter: `isFile`
                    },
                    {
                        expand: true,
                        nonull: true,
                        cwd: `src/server/views`,
                        src: [`**`],
                        dest: `build/src/server/views`,
                        filter: `isFile`
                    }
                ]
            }
        },

        clean: {
            client: [`build/*`]
        }
    });

    // Build script.
    grunt.registerTask(`build`, [
        `clean:client`,
        `copy:client`
    ]);

    // Load required npm tasks.
    grunt.loadNpmTasks(`grunt-contrib-copy`);
    grunt.loadNpmTasks(`grunt-contrib-clean`);
};
