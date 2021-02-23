#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import { CdkidpoolStack } from '../lib/cdkidpool-stack'

const STAGE = 'trial'
const STACK_NAME = 'cdkidpool' + STAGE + 'stack'

const app = new cdk.App()
new CdkidpoolStack(app, STACK_NAME, {
    stage: STAGE
})
