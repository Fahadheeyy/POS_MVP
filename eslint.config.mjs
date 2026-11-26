import tseslint from 'typescript-eslint';

export default [
  { ignores: ['.next/**', 'next-env.d.ts', 'reference_designs/**', 'figma-wireframes/**'] },
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: { parser: tseslint.parser },
    rules: {
      'no-debugger': 'error',
      'no-dupe-else-if': 'error',
      'no-duplicate-case': 'error',
      'no-unreachable': 'error',
      'no-unsafe-finally': 'error',
      'valid-typeof': 'error',
    },
  },
];
