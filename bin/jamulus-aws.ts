#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { JamulusAwsStack } from '../lib/jamulus-aws-stack';
import { config } from 'dotenv';

config();  // Populate process.env from .env

const keyPairName = process.env.KEY_PAIR_NAME!;
const sshCidrRange = process.env.LOCAL_CIDR_RANGE!;
const jamulusPort = Number(process.env.JAMULUS_PORT!);
const instanceType = process.env.INSTANCE_TYPE!;
const account = process.env.AWS_ACCOUNT_NUMBER!;
const region = process.env.AWS_REGION!;

const app = new cdk.App();
new JamulusAwsStack(app, 'JamulusAwsStack', {
  env: {
    account,
    region
  },
  keyPairName,
  sshCidrRange,
  instanceType,
  jamulusPort
});
