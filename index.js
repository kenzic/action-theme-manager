const core = require('@actions/core');
const github = require('@actions/github');
const Shopify = require('shopify-api-node');
const _ = require('lodash');

const {
  STORE_NAME,
  API_KEY,
  API_SECRET
} = process.env;


const shopify = new Shopify({
  shopName: STORE_NAME,
  apiKey: API_KEY,
  password: API_SECRET
});

async function getTheme(themeId) {
  return await shopify.theme.get(themeId)
}

async function getAllThemes() {
  return await shopify.theme.list();
}

function filterUnpublished(themes) {
  return _.filter(themes, (theme) => theme.role === "unpublished");
}

function canDeployToTheme(theme) {
  if (theme.role !== "unpublished") return false;

  return true;
}

async function createNewTheme (name) {
  return await shopify.theme.create({
    name
  })
}

function themeNameExists(name, themes) {
  return !!_.find(themes, (theme) => theme.name === name);
}

async function renameTheme (themeId, newName) {
  return await shopify.theme.update(themeId, {
    name: newName
  });
}

async function getOrCreateTheme (name) {
  let themes = await getAllThemes();
  themes = filterUnpublished(themes);
  if (themeNameExists(name, themes)) {
    // TODO: what if there are two of the same name
    return _.find(themes, (theme) => theme.name === name);
  } else {
    const theme = await createNewTheme(name);
    return theme;
  }
}

async function run () {
  console.log('called')
  try {
    const themeName = core.getInput('themeName');
    if (!themeName) throw new Error('themeName required')

    if (themeName === "master") {
      themeName = "release-candidate";
    }
    console.log('themeName', themeName)
    const theme = await getOrCreateTheme(themeName);

    console.log('output', theme)
    core.setOutput("themeId", theme.id)
    // Get the JSON webhook payload for the event that triggered the workflow
    // const payload = JSON.stringify(github.context.payload, undefined, 2)
    // console.log(`The event payload: ${payload}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run()
