module.exports = {
  env: { browser: true, es2020: true, node: true },
  ignorePatterns: [
    "*.mjs",
    "*.cjs",
    "**/*.js",
    "**/dist/*",
    "**/build/*",
    "*.css",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
    project: "./tsconfig.json",
  },
  extends: [
    "eslint:recommended",
    "plugin:react-hooks/recommended",
    "plugin:react/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:jsx-a11y/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:tailwindcss/recommended",
    "plugin:prettier/recommended",
    "prettier",
  ],
  settings: {
    react: {
      version: 'detect',
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
      },
    },
  },
  plugins: ["react-refresh", "@typescript-eslint", "import"],
  rules: {
    // Most of the files will probably get extended in the future, which
    // could result into multiple refactoring. Named exports can also help
    // with tree shaking. Thats why they are preferred in general.
    "import/prefer-default-export": "off",

    // This rule is disabled, because it's not needed within vite.
    "react/react-in-jsx-scope": "off",

    // Sometimes it is just not possible for a value to be null, based on the code before.
    // Typescript doesn't have the ability to detect these cases. Then it's ok to use a no
    // null assertion.
    "@typescript-eslint/no-non-null-assertion": "off",

    // This rule is enabled to prevent typos. It shows an error because it's likely possible,
    // that you didn't want to return an assignment, instead wanted to use the comparison operator.
    // These issues should get caught by typings. Also sometimes it allows to write shorter and more
    // readable code.
    "no-return-assign": "off",

    // Callback methods can be used to manipulate the target of the event (e.g. clear the input field).
    // This should not be discouraged.
    "no-param-reassign": "off",

    // Imports should be grouped with spacing and should be alphabetized
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
          "object",
          "type",
        ],
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
        "newlines-between": "always",
      },
    ],

    // This is the default configuration of the airbnb base rules. However loops got enabled again, because this rule
    // is outdated and not relevant anymore.
    'no-restricted-syntax': [
      'error',
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],

    // When someone uses a spread operator for a hook, its to improve reusability. Static analysis cant be done there,
    // however this should not be discouraged.
    "react-hooks/exhaustive-deps": "off",
    "no-promise-executor-return": "off"
  },
};
