# GithubWebook Processor

Create an API Gateway endpoint, and queues for [every webhook available by Github](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads).

This repo will assist you in creating an

- API Gateway
- Separate SQS queue for each event registered by the infrastructure that is available but Github

# Quickstart

1. [Deploy the infrasturcture](./infrastructure/README.md)
2. Set up a github webhook pointing to the endpoint created by your API Gateway deployment
3. Github will send event to your new API gateway endpoint
4. ... more to come
