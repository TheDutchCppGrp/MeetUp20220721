#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ImageLambdaDemoCdkStack } from '../lib/image-lambda-demo-cdk-stack';
import {ImageLambdaDemoCdkInfraStack} from "../lib/image-lambda-demo-cdk-infra-stack";

const app = new cdk.App();
const infraStack = new ImageLambdaDemoCdkInfraStack(app, 'ImageLambdaDemoInfraStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
});

new ImageLambdaDemoCdkStack(app, 'ImageLambdaDemoStack', {
  env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION
  }
}).addDependency(infraStack);