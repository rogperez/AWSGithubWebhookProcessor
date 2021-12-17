import * as cdk from "@aws-cdk/core";
import * as sqs from "@aws-cdk/aws-sqs";
import * as iam from "@aws-cdk/aws-iam";
import * as apigw from "@aws-cdk/aws-apigateway";
import { Aws } from "@aws-cdk/core";

export interface GithubWebhookProcessorProps extends cdk.StackProps {
  supportedWebhooks: string[];
}

export class GithubWebhookProcessor extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: GithubWebhookProcessorProps) {
    super(scope, id, props);

    /**
     * Queue
     */
    const queue = new sqs.Queue(this, "Queue");

    /**
     * Role
     */
    const role = new iam.Role(this, "QueueSendMessageRole", {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
    });
    queue.grantSendMessages(role);

    /**
     * API
     */
    const apiGateway = new apigw.RestApi(this, "GithubWebhook");
    apiGateway.root.addMethod(
      "POST",
      new apigw.Integration({
        type: apigw.IntegrationType.AWS,
        integrationHttpMethod: "POST",
        uri: `arn:${Aws.PARTITION}:apigateway:${Aws.REGION}:sqs:path/${Aws.ACCOUNT_ID}/${queue.queueName}`,
        options: {
          passthroughBehavior: apigw.PassthroughBehavior.NEVER,
          credentialsRole: role,
          requestParameters: {
            "integration.request.header.Content-Type": "'application/json'",
          },
          requestTemplates: {
            "application/json": "Action=SendMessage&MessageBody=$input.body",
          },
          integrationResponses: [
            {
              statusCode: "200",
              responseTemplates: {
                "application/json": "success",
              },
            },
          ],
        },
      }),
      {
        methodResponses: [
          {
            statusCode: "200",
            responseModels: {
              "application/json": apigw.Model.EMPTY_MODEL,
            },
          },
        ],
      }
    );
  }
}
