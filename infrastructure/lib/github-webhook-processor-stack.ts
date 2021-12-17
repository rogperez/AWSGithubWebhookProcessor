import * as cdk from "@aws-cdk/core";
import * as sqs from "@aws-cdk/aws-sqs";
import * as iam from "@aws-cdk/aws-iam";
import { Integration, IntegrationType, RestApi } from "@aws-cdk/aws-apigateway";
import { Role, ServicePrincipal } from "@aws-cdk/aws-iam";
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
      assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
    });
    queue.grantSendMessages(role);

    /**
     * API
     */
    const apiGateway = new RestApi(this, "API");
    apiGateway.root.addMethod(
      "POST",
      new Integration({
        type: IntegrationType.AWS,
        integrationHttpMethod: "POST",
        uri: `arn:${Aws.PARTITION}:apigateway:${Aws.REGION}:sqs:path/${Aws.ACCOUNT_ID}/${queue.queueName}`,
        options: {
          credentialsRole: role,
          requestParameters: {
            "integration.request.header.Content-Type": "'application/json'",
          },
          requestTemplates: {
            "application/json": "Action=SendMessage&MessageBody=$input.body",
          },
        },
      })
    );
  }
}
