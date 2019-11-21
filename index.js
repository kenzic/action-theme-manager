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

function themeNameExists(name, themes) {
  return !!_.find(themes, (theme) => theme.name === name);
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

async function run() {
  try {
    let themeName = core.getInput('themeName');
    if (!themeName) throw new Error('themeName required');

    if (themeName === 'master') {
      themeName = 'release-candidate';
    }

    const theme = await getOrCreateTheme(themeName);

    core.setOutput('themeId', theme.id);
    // Get the JSON webhook payload for the event that triggered the workflow
    // const payload = JSON.stringify(github.context.payload, undefined, 2)
    // console.log(`The event payload: ${payload}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
