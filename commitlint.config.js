export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 80],
    'scope-enum': [
      2,
      'always',
      [
        'alarms',
        'bookmarks',
        'build',
        'ci',
        'deps',
        'docs',
        'feed',
        'manifest',
        'options',
        'privacy',
        'title',
      ],
    ],
  },
};
