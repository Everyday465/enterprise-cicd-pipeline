import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface InfrastructureStackProps extends cdk.StackProps {
  DEPLOY_ENVIRONMENT: string;
}
export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    const { DEPLOY_ENVIRONMENT } = props;

    console.log(`${DEPLOY_ENVIRONMENT} environment detected. deploy s3 bucket`);

    const infrastructureBucket = new s3.Bucket(
      this,
      'InfrastructureBucket',
      {
        bucketName: `everyday465devops-${DEPLOY_ENVIRONMENT}-infrastructure-bucket`,
        removalPolicy: cdk.RemovalPolicy.DESTROY
      }
    )

    

  }
}
