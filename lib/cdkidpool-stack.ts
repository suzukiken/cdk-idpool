import * as cdk from "@aws-cdk/core";
import * as cognito from "@aws-cdk/aws-cognito";
import * as iam from "@aws-cdk/aws-iam";
import * as sm from "@aws-cdk/aws-secretsmanager";
import * as kms from "@aws-cdk/aws-kms";

/*
npm install @aws-cdk/core
npm install @aws-cdk/aws-cognito
npm install @aws-cdk/aws-iam
npm install @aws-cdk/aws-secretsmanager
npm install @aws-cdk/aws-kms
*/

export class CdkidpoolStack extends cdk.Stack {
  public readonly user_pool: cognito.UserPool;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //------------------read parameters from ssm parameter store and Secuity Manager

    const imported_key = kms.Key.fromKeyArn(
      this,
      "imported_key",
      "arn:aws:kms:ap-northeast-1:656169322665:key/26440667-2a0b-4b90-bf15-210d80e12922"
    );

    const google_secret = sm.Secret.fromSecretAttributes(
      this,
      "google_secret",
      {
        secretArn:
          "arn:aws:secretsmanager:ap-northeast-1:656169322665:secret:GoogleAuthSSOInternal-sqGgUh",
        encryptionKey: imported_key,
      }
    );

    const GOOGLE_CLIENT_ID = google_secret
      .secretValueFromJson("GOOGLE_CLIENT_ID")
      .toString();

    const id_pool = new cognito.CfnIdentityPool(this, "id_pool", {
      allowUnauthenticatedIdentities: true,
      supportedLoginProviders: {
          'accounts.google.com': GOOGLE_CLIENT_ID
      },
      identityPoolName: "cdkidpool-id-pool",
    });

    const iam_authenticated_role = new iam.Role(this, "iam_auth_role", {
      assumedBy: new iam.FederatedPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": id_pool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
      roleName: "cdkidpool-authenticated-role",
    });

    const iam_unauthenticated_role = new iam.Role(this, "iam_unauth_role", {
      assumedBy: new iam.FederatedPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": id_pool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "unauthenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
      roleName: "cdkidpool-unauthenticated-role",
    });

    new cognito.CfnIdentityPoolRoleAttachment(this, "id_pool_role_attach", {
      identityPoolId: id_pool.ref,
      roles: {
        authenticated: iam_authenticated_role.roleArn,
        unauthenticated: iam_unauthenticated_role.roleArn,
      },
    });

  }
}
