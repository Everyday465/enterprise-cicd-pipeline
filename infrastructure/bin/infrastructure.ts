#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure-stack';

const app = new cdk.App();
if (!process.env.DEPLOY_ENVIRONMENT) throw new Error("DEPLOY_ENVIRONMENT is not defined");
const {DEPLOY_ENVIRONMENT } = process.env;
new InfrastructureStack(app, `${DEPLOY_ENVIRONMENT}-Infrastructure-Stack`, 
    {
        DEPLOY_ENVIRONMENT,
        description: `Stack for the ${DEPLOY_ENVIRONMENT} infrastructure deployed using thje CI pipeline. If you need to delete everything involving the ${DEPLOY_ENVIRONMENT} environment, delete this stack first, then the CI stack.`
  
});