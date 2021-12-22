import * as cdk from "@aws-cdk/core";
import * as sqs from "@aws-cdk/aws-sqs";
import * as iam from "@aws-cdk/aws-iam";
import * as apigw from "@aws-cdk/aws-apigateway";
import { Aws } from "@aws-cdk/core";

export interface GithubWebhookProcessorProps extends cdk.StackProps {
  supportedWebhooks?: string[];
}

export class GithubWebhookProcessor extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: GithubWebhookProcessorProps) {
    super(scope, id, props);

    /**
     * Role
     */
    const role = new iam.Role(this, "QueueSendMessageRole", {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
    });

    (props.supportedWebhooks || []).forEach((event) => {
      /**
       * Queue
       */
      const capitalizedQueue = event.charAt(0).toUpperCase() + event.slice(1);
      const queue = new sqs.Queue(this, `Github${capitalizedQueue}Queue`, {
        queueName: `Github-${event}-Queue`,
      });

      queue.grantSendMessages(role);
    });

    /**
     * API
     */
    const apiGateway = new apigw.RestApi(this, "GithubWebhook");
    apiGateway.root.addMethod(
      "POST",
      new apigw.Integration({
        type: apigw.IntegrationType.AWS,
        integrationHttpMethod: "POST",
        uri: `arn:${Aws.PARTITION}:apigateway:${Aws.REGION}:sqs:path/${Aws.ACCOUNT_ID}/Github-{github-event}-Queue`,
        options: {
          passthroughBehavior: apigw.PassthroughBehavior.NEVER,
          credentialsRole: role,
          requestParameters: {
            "integration.request.header.Content-Type": "'application/x-www-form-urlencoded'",
            "integration.request.path.github-event": "method.request.header.x-github-event",
          },
          requestTemplates: {
            "application/json":
              "Action=SendMessage&MessageBody={\n" +
              '  "data" : $input.body,\n' +
              '  "headers": {\n' +
              "    #foreach($param in $input.params().header.keySet())\n" +
              '    "$param": "$util.escapeJavaScript($input.params().header.get($param))" #if($foreach.hasNext),#end\n' +
              "    #end\n" +
              "  }\n" +
              "}",
          },
          integrationResponses: [
            {
              statusCode: "200",
              responseTemplates: {
                "application/json": "200: Success",
              },
            },
          ],
        },
      }),
      {
        requestParameters: {
          "method.request.header.x-github-event": false,
        },
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
