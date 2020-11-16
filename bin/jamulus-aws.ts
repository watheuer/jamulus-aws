#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { JamulusAwsStack } from '../lib/jamulus-aws-stack';

const app = new cdk.App();
new JamulusAwsStack(app, 'JamulusAwsStack', {
    env: {
        account: '092565164179',
        region: 'us-east-1'
    }
});
