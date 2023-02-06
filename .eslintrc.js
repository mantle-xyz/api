module.exports = {
  plugins: ["@typescript-eslint"],
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  rules: {
    "prefer-const": "error",
    "@typescript-eslint/no-unused-vars": "error",
    // "@typescript-eslint/no-explicit-any": "error",
  },
};
