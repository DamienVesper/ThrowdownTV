module.exports = (grunt) => {
    grunt.initConfig({
        pkg: grunt.file.readJSON(`package.json`),

        // Copy files over to the static folder.
        copy: {
            // Copy libs to build
            client: {
                files: [
                    {
                        expand: true,
                        nonull: true,
                        cwd: `src/client`,
                        src: [`**`],
                        dest: `build/src/client`,
                        filter: `isFile`
                    }
                ]
            }
        },

        // Clean up static folder and unminified client source.
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
