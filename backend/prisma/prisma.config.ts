export default {
  datasource: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://user:password@localhost:5432/divancosaas",
  },
};
