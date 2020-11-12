#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { JamulusAwsStack } from '../lib/jamulus-aws-stack';

const app = new cdk.App();
new JamulusAwsStack(app, 'JamulusAwsStack');
