const core = require('@actions/core');
const github = require('@actions/github');
const Shopify = require('shopify-api-node');
const _ = require('lodash');

const {
  STORE_NAME,
  API_KEY,
  API_SECRET,
} = process.env;


const shopify = new Shopify({
  shopName: STORE_NAME,
  apiKey: API_KEY,
  password: API_SECRET,
});

async function getTheme(themeId) {
  return shopify.theme.get(themeId);
}

async function getAllThemes() {
  return shopify.theme.list();
}

function filterUnpublished(themes) {
  return _.filter(themes, (theme) => theme.role === 'unpublished');
}

async function createNewTheme(name) {
  return shopify.theme.create({
    name,
  });
}

function findThemeByName(name, themes) {
  return _.find(themes, (theme) => theme.name === name);
}

function themeNameExists(name, themes) {
  return !!findThemeByName(name, themes)
}

async function renameTheme(themeId, newName) {
  return shopify.theme.update(themeId, {
    name: newName,
  });
}

async function getOrCreateTheme(name) {
  let themes = await getAllThemes();
  themes = filterUnpublished(themes);
  if (themeNameExists(name, themes)) {
    // TODO: what if there are two of the same name
    return _.find(themes, (theme) => theme.name === name);
  }

  const theme = await createNewTheme(name);
  return theme;
}

// Task Types:
// - getOrCreate
//    - name (optional) - if not provided, it uses the branch name
// - get
//    - themeId
// - create
//    - name
// - delete
//    - themeId

async function run() {
  try {
    const payload = JSON.stringify(github.context, undefined, 2)
    console.log('payload', payload)
    const branchName = github.context.ref.replace('refs/heads/', '');
    let themeName = branchName;
    let taskType = core.getInput('taskType');

    if (taskType === "get-or-create") {

      if (!themeName) throw new Error('themeName required');

      if (themeName === 'master') {
        themeName = 'release-candidate';
      }

      const theme = await getOrCreateTheme(themeName);

      core.setOutput('themeId', theme.id);
    } else if (taskType === 'get') {
      const _themeName = core.getInput('themeName');
      if (_themeName) {
        themeName = _themeName;
      }
      const themes = await getAllThemes();
      const theme = findThemeByName(themeName, themes);

      if (!theme) throw new Error(`no theme found by name ${themeName}`);

      core.setOutput('themeId', theme.id);
    } else {
      throw new Error('taskType required');
    }
    // Get the JSON webhook payload for the event that triggered the workflow
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
