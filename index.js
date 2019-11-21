const core = require('@actions/core');
const github = require('@actions/github');

try {
  // `who-to-greet` input defined in action metadata file
  const themeName = core.getInput('themeName');
  console.log(`Hello ${themeName}!`);
  const time = (new Date()).toTimeString();
  core.setOutput("themeId", "123123123");
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}