module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel", // This is the ONLY place it should be in v4
    ],
    plugins: [
      "react-native-reanimated/plugin", // Keep this at the end
    ],
  };
};