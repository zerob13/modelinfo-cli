/** @type {import("prettier").Config} */
const config = {
  plugins: ["prettier-plugin-packagejson"],
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
};

export default config;
