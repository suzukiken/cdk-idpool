#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkidpoolStack } from '../lib/cdkidpool-stack';

const app = new cdk.App();
new CdkidpoolStack(app, 'CdkidpoolStack');
