export default {
  test: {
    // SQLite em memória: os testes não tocam o arquivo do banco de desenvolvimento.
    env: { DATABASE_FILE: ':memory:' },
    // `npm run test:cobertura` gera o relatório em coverage/ (abra coverage/index.html).
    coverage: {
      include: ['src/**/*.js'],
      exclude: ['src/server.js'],
      // json-summary e json alimentam o comentário de cobertura no PR (CI).
      reporter: ['text', 'html', 'json-summary', 'json'],
      reportOnFailure: true,
    },
  },
};
