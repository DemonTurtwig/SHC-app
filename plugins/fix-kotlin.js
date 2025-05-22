// plugins/fix-kotlin.js
const { withGradleProperties } = require('@expo/config-plugins');
module.exports = function fixKotlin(c) {
  return withGradleProperties(c, (config) => {
    const KV = 'android.kotlinVersion';
    const NEW = '1.8.22';
    const props = config.modResults;
    const idx = props.findIndex(p => p.key === KV);
    if (idx > -1) props[idx].value = NEW;
    else props.push({ type: 'property', key: KV, value: NEW });
    return config;
  });
};