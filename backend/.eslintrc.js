module.exports = {
    env: {
        node: true,
        es2021: true,
        jest: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module'
    },
    rules: {
        // Error prevention
        'no-console': 'off', // Allow console.log in backend
        'no-unused-vars': ['error', {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_'
        }],
        'no-undef': 'error',
        'no-unreachable': 'error',
        'no-duplicate-imports': 'error',

        // Code style
        'indent': ['error', 4],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'comma-dangle': ['error', 'never'],
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],

        // Best practices
        'eqeqeq': ['error', 'always'],
        'no-var': 'error',
        'prefer-const': 'error',
        'no-magic-numbers': ['warn', {
            ignore: [0, 1, -1, 200, 201, 400, 401, 403, 404, 500],
            ignoreArrayIndexes: true
        }],

        // Security
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',

        // Async/await
        'require-await': 'error',
        'no-async-promise-executor': 'error',
        'no-await-in-loop': 'warn',

        // Error handling
        'handle-callback-err': 'error',
        'no-throw-literal': 'error'
    },
    globals: {
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly'
    }
};