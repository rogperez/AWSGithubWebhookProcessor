#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { GithubWebhookProcessor } from "../lib/github-webhook-processor-stack";

const app = new cdk.App();
new GithubWebhookProcessor(app, "GithubWebhookProcessor", {
  supportedWebhooks: ["organization", "member"],
  tags: {
    Project: "GithubWebhooks",
  },
});
