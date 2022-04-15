import { build, emptyDir } from 'https://deno.land/x/dnt@0.23.0/mod.ts';
import { version } from './lib/version.ts';

await emptyDir('./npm');

await build({
    entryPoints: ['./lib/mod.ts'],
    outDir: './npm',
    shims: {
        // see JS docs for overview and more options
        deno: true,
    },
    package: {
        // package.json properties
        name: 'cloudconvert',
        version,
        description: 'Official Node.js SDK for the CloudConvert API',
        license: 'MIT',
        repository: {
            type: 'git',
            url: 'https://github.com/cloudconvert/cloudconvert-node.git',
        },
        bugs: {
            url: 'https://github.com/cloudconvert/cloudconvert-node/issues',
        },
    },
});

// post build steps
Deno.copyFileSync('LICENSE', 'npm/LICENSE');
Deno.copyFileSync('README.md', 'npm/README.md');
