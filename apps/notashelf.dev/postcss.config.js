export default {
  plugins: {
    "postcss-preset-env": {
      stage: 2,
      features: {
        "nesting-rules": true,
        "custom-properties": true,
        "media-query-ranges": true,
      },
    },
    cssnano: {
      preset: [
        "default",
        {
          discardComments: {
            removeAll: true,
          },
          normalizeWhitespace: true,
          mergeLonghand: true,
          mergeRules: true,
          minifySelectors: true,
          minifyParams: true,
          minifyFontValues: true,
          colormin: true,
          convertValues: true,
          discardDuplicates: true,
          discardEmpty: true,
          discardOverridden: true,
          normalizeUrl: true,
          reduceIdents: false, // keep this false to avoid breaking CSS custom properties
          zindex: false, // keep this false to avoid z-index conflicts
        },
      ],
    },
  },
};
