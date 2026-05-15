import * as core from "@actions/core";
import * as github from "@actions/github";
import { action } from "./src/action.js";

action(github.context.payload).catch((error) => {
  // Action threw an error. Fail the action with the error message.
  core.debug(error.stack);
  core.setFailed(error.message);
});
