import globals from "globals";
import prettierRecommended from "eslint-plugin-prettier/recommended";

export default [
    {
        ignores: ["**/dist/"],
    },
    prettierRecommended,
    {
        languageOptions: {
            globals: {
                ...globals.node,
            },

            ecmaVersion: 2022,
            sourceType: "module",
        },
    },
];
