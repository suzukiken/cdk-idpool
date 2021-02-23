import * as cdk from "@aws-cdk/core"
import * as cognito from "@aws-cdk/aws-cognito"
import * as iam from "@aws-cdk/aws-iam"

interface CdkidpoolStackProps extends cdk.StackProps {
    stage: string
}

export class CdkidpoolStack extends cdk.Stack {
  public readonly user_pool: cognito.UserPool

  constructor(scope: cdk.Construct, id: string, props: CdkidpoolStackProps) {
    super(scope, id, props)
    
    const GOOGLE_CLIENT_ID = "<xxxx.apps.googleusercontent.com>" // replace <xxxx.apps.googleusercontent.com> with real client id.
    const NAME_PREFIX = "cdkidpool-" + props.stage + "-"

    const id_pool = new cognito.CfnIdentityPool(this, "id_pool", {
      allowUnauthenticatedIdentities: true,
      supportedLoginProviders: {
          'accounts.google.com': GOOGLE_CLIENT_ID
      },
      identityPoolName: NAME_PREFIX + "id-pool",
    })

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
      roleName: NAME_PREFIX + "authenticated-role",
    })

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
      roleName: NAME_PREFIX + "unauthenticated-role",
    })

    new cognito.CfnIdentityPoolRoleAttachment(this, "id_pool_role_attach", {
      identityPoolId: id_pool.ref,
      roles: {
        authenticated: iam_authenticated_role.roleArn,
        unauthenticated: iam_unauthenticated_role.roleArn,
      },
    })

  }
}
