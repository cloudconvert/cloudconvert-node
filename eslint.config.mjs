import { defineConfig, globalIgnores } from 'eslint/config';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
    globalIgnores([
        '**/node_modules/',
        '**/built/',
        '**/package-lock.json',
        '**/package.json',
        'tests/unit/requests/',
        'tests/unit/responses/',
        '.vscode/',
        'tsconfig.json',
        '.mocharc.json'
    ]),
    {
        extends: compat.extends(
            'eslint:recommended',
            'plugin:@typescript-eslint/recommended'
        ),

        plugins: {
            '@typescript-eslint': typescriptEslint
        },

        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            },

            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'module'
        },

        rules: {
            '@typescript-eslint/no-explicit-any': 'off'
        }
    }
]);
