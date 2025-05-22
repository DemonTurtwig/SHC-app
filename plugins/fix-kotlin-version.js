// plugins/fix-kotlin-version.js
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs').promises;
const path = require('path');

const KOTLIN_VERSION = '1.8.22';

module.exports = function fixKotlinVersion(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const androidDir = cfg.modRequest.platformProjectRoot;

      const rootGradlePropsPath = path.join(projectRoot, 'gradle.properties');
      const androidGradlePropsPath = path.join(androidDir, 'gradle.properties');
      const buildGradlePath = path.join(androidDir, 'build.gradle');

      // ✅ Copy root gradle.properties to android/gradle.properties
      try {
        const rootProps = await fs.readFile(rootGradlePropsPath, 'utf8');
        await fs.writeFile(androidGradlePropsPath, rootProps);
        console.log('✔ Copied root gradle.properties to android/');
      } catch (err) {
        console.warn('⚠ Failed to copy root gradle.properties:', err);
      }

      // ✅ Inject ext.kotlinVersion if not present
      try {
        let gradle = await fs.readFile(buildGradlePath, 'utf8');

        if (!gradle.includes('ext.kotlinVersion')) {
          gradle = gradle.replace(
            /buildscript\s*{/,
            `buildscript {\n    ext.kotlinVersion = '${KOTLIN_VERSION}'`
          );
        }

        // Ensure classpath uses the variable, not hardcoded version
        gradle = gradle.replace(
          /classpath\(['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin.*?['"]\)/g,
          `classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")`
        );

        await fs.writeFile(buildGradlePath, gradle);
        console.log('✔ Patched build.gradle with ext.kotlinVersion');
      } catch (err) {
        console.warn('⚠ Failed to patch build.gradle:', err);
      }

      return cfg;
    },
  ]);
};
